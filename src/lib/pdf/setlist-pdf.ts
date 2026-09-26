import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/** Datos mínimos para imprimir un setlist (independientes de Prisma). */
export type SetlistPdfItem = {
  type: "SONG" | "BREAK" | "ENCORE" | "NOTE";
  comment: string | null;
  /** Duración prevista de pausas y notas ("1:00"); null en canciones. */
  duration?: string | null;
  song: {
    title: string;
    artist: string | null;
    keySignature: string | null;
    tempo: number | null;
    timeSignature: string | null;
    tuning?: string | null;
    leadVocal: string | null;
    duration: string;
    technicalNotes: string | null;
  } | null;
};

export type SetlistPdfData = {
  bandName: string;
  name: string;
  notes: string | null;
  event: { title: string; startAt: Date; venue: string | null } | null;
  totalDuration: string;
  items: SetlistPdfItem[];
};

export type SetlistPdfFonts = {
  /** Anton: titulares de cartel. */
  display: Uint8Array;
  /** Instrument Serif cursiva: notas y pausas. */
  serif: Uint8Array;
};

/**
 * "stage": para pegar en el suelo del escenario, letra enorme, una hoja.
 * "full": para el técnico y ensayos, con tono, tempo, compás, voz y notas.
 */
export type SetlistPdfVariant = "stage" | "full";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 40;
const INK = rgb(0.07, 0.06, 0.08);
const RED = rgb(0.878, 0.188, 0.118);
const GREY = rgb(0.42, 0.4, 0.44);
const RULE = rgb(0.85, 0.83, 0.8);

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function formatEventDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday") || DAYS[date.getDay()];
  const month = get("month").replace(".", "") || MONTHS[date.getMonth()];
  return `${weekday} ${get("day")} ${month} ${get("year")} · ${get("hour")}:${get("minute")}`;
}

/** Las fuentes estándar (WinAnsi) no admiten todo Unicode: se filtra lo que no cabe. */
function winAnsi(text: string) {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7E\xA0-\xFF€–—…•]/g, "");
}

type Fonts = { display: PDFFont; serif: PDFFont; sans: PDFFont; sansBold: PDFFont };

/** Recorta con "…" hasta que el texto quepa en el ancho dado. */
function fit(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}…`, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}…`;
}

/** Tamaño máximo (≤ size) con el que el texto cabe en el ancho. */
function shrinkToFit(text: string, font: PDFFont, size: number, maxWidth: number, min: number) {
  let current = size;
  while (current > min && font.widthOfTextAtSize(text, current) > maxWidth) current -= 0.5;
  return current;
}

function drawHeader(page: PDFPage, fonts: Fonts, data: SetlistPdfData, timeZone: string, compact: boolean) {
  const { width, height } = page.getSize();
  let y = height - MARGIN;

  // Franja superior: banda y marca
  const band = winAnsi(data.bandName.toUpperCase());
  page.drawText(band, { x: MARGIN, y: y - 9, size: 9, font: fonts.sansBold, color: RED });
  const brand = "BANDMANAGER · SETLIST";
  page.drawText(brand, {
    x: width - MARGIN - fonts.sans.widthOfTextAtSize(brand, 7),
    y: y - 8,
    size: 7,
    font: fonts.sans,
    color: GREY,
  });
  y -= 16;

  // Título de cartel
  const titleSize = shrinkToFit(data.name.toUpperCase(), fonts.display, compact ? 28 : 34, width - MARGIN * 2, 16);
  y -= titleSize;
  page.drawText(data.name.toUpperCase(), { x: MARGIN, y, size: titleSize, font: fonts.display, color: INK });

  // Evento, fecha y sala
  const meta: string[] = [];
  if (data.event) {
    meta.push(data.event.title);
    meta.push(formatEventDate(data.event.startAt, timeZone));
  }
  const venue = data.event?.venue;
  y -= 16;
  if (meta.length) {
    page.drawText(fit(winAnsi(meta.join(" · ")), fonts.sans, 10, width - MARGIN * 2), {
      x: MARGIN,
      y,
      size: 10,
      font: fonts.sans,
      color: INK,
    });
    y -= 14;
  }
  if (venue) {
    page.drawText(fit(`en ${venue}`, fonts.serif, 12, width - MARGIN * 2), { x: MARGIN, y, size: 12, font: fonts.serif, color: GREY });
    y -= 12;
  }

  // Filete rojo + duración total
  y -= 6;
  page.drawRectangle({ x: MARGIN, y, width: width - MARGIN * 2, height: 2.5, color: RED });
  const total = `${data.items.filter((i) => i.type === "SONG").length} canciones · ${data.totalDuration}`;
  page.drawText(winAnsi(total), {
    x: width - MARGIN - fonts.sansBold.widthOfTextAtSize(total, 8),
    y: y + 7,
    size: 8,
    font: fonts.sansBold,
    color: INK,
  });
  return y - 14;
}

function drawFooter(page: PDFPage, fonts: Fonts, index: number, total: number) {
  const { width } = page.getSize();
  const text = total > 1 ? `Hoja ${index + 1} de ${total}` : "";
  page.drawLine({ start: { x: MARGIN, y: MARGIN - 8 }, end: { x: width - MARGIN, y: MARGIN - 8 }, thickness: 0.5, color: RULE });
  if (text) {
    page.drawText(text, {
      x: width - MARGIN - fonts.sans.widthOfTextAtSize(text, 7),
      y: MARGIN - 20,
      size: 7,
      font: fonts.sans,
      color: GREY,
    });
  }
  page.drawText("Impreso con BandManager", { x: MARGIN, y: MARGIN - 20, size: 7, font: fonts.sans, color: GREY });
}

function markerLabel(item: SetlistPdfItem) {
  const base =
    item.type === "BREAK" ? item.comment || "Pausa" : item.type === "ENCORE" ? item.comment || "Bis" : item.comment || "Nota";
  return item.duration && item.duration !== "—" ? `${base} (${item.duration})` : base;
}

/** Versión escenario: números y títulos enormes que se leen a dos metros. */
function drawStage(doc: PDFDocument, fonts: Fonts, data: SetlistPdfData, timeZone: string) {
  const items = data.items;
  // Tamaño de letra según cuántas filas haya: todo en una hoja si es posible
  const firstPage = doc.addPage([A4.width, A4.height]);
  const top = drawHeader(firstPage, fonts, data, timeZone, true);
  const available = top - (MARGIN + 6);
  const weights = items.map((i) => (i.type === "SONG" ? 1 : 0.55));
  const units = weights.reduce((a, b) => a + b, 0) || 1;
  // Pocas canciones → letra enorme; muchas → se ajusta (mín. legible 30 pt de fila)
  const rowUnit = Math.min(92, Math.max(30, available / units));
  const titleSize = Math.min(62, rowUnit * 0.68);

  const pages: PDFPage[] = [firstPage];
  let page = firstPage;
  let y = top;
  let songNumber = 0;
  const width = A4.width - MARGIN * 2;

  for (const item of items) {
    const rowHeight = rowUnit * (item.type === "SONG" ? 1 : 0.55);
    if (y - rowHeight < MARGIN + 6) {
      page = doc.addPage([A4.width, A4.height]);
      pages.push(page);
      y = drawHeader(page, fonts, data, timeZone, true);
    }
    const baseline = y - rowHeight / 2 - titleSize * 0.36;

    if (item.type === "SONG" && item.song) {
      songNumber += 1;
      const number = String(songNumber).padStart(2, "0");
      const numberWidth = fonts.display.widthOfTextAtSize("00", titleSize) + 14;
      page.drawText(number, { x: MARGIN, y: baseline, size: titleSize, font: fonts.display, color: RED });

      const key = winAnsi([item.song.keySignature, item.song.tuning].filter(Boolean).join(" · "));
      const keySize = Math.max(12, titleSize * 0.42);
      const keyWidth = key ? fonts.sansBold.widthOfTextAtSize(key, keySize) + 12 : 0;
      const title = item.song.title.toUpperCase();
      const maxTitle = width - numberWidth - keyWidth;
      const size = shrinkToFit(title, fonts.display, titleSize, maxTitle, titleSize * 0.6);
      page.drawText(fit(title, fonts.display, size, maxTitle), {
        x: MARGIN + numberWidth,
        y: baseline,
        size,
        font: fonts.display,
        color: INK,
      });
      if (key) {
        page.drawText(key, {
          x: A4.width - MARGIN - keyWidth + 12,
          y: baseline,
          size: keySize,
          font: fonts.sansBold,
          color: GREY,
        });
      }
    } else {
      // Pausa / bis / nota: separador con texto en cursiva
      const label = markerLabel(item);
      const text = item.type === "ENCORE" ? label.toUpperCase() : label;
      const font = item.type === "ENCORE" ? fonts.display : fonts.serif;
      const size = Math.max(12, titleSize * (item.type === "ENCORE" ? 0.55 : 0.5));
      const textWidth = font.widthOfTextAtSize(text, size);
      const mid = y - rowHeight / 2;
      const cx = MARGIN + width / 2;
      page.drawLine({ start: { x: MARGIN, y: mid }, end: { x: cx - textWidth / 2 - 10, y: mid }, thickness: 1, color: item.type === "ENCORE" ? RED : RULE });
      page.drawLine({ start: { x: cx + textWidth / 2 + 10, y: mid }, end: { x: MARGIN + width, y: mid }, thickness: 1, color: item.type === "ENCORE" ? RED : RULE });
      page.drawText(text, { x: cx - textWidth / 2, y: mid - size * 0.32, size, font, color: item.type === "ENCORE" ? RED : GREY });
    }
    y -= rowHeight;
  }
  return pages;
}

/** Versión detallada: tabla con datos técnicos y notas de cada tema. */
function drawFull(doc: PDFDocument, fonts: Fonts, data: SetlistPdfData, timeZone: string) {
  const pages: PDFPage[] = [];
  let page = doc.addPage([A4.width, A4.height]);
  pages.push(page);
  let y = drawHeader(page, fonts, data, timeZone, false);
  const right = A4.width - MARGIN;
  // Columnas a la derecha: Afinación · Tono · BPM · Compás · Duración
  const cols = [
    { label: "AFIN.", width: 74 },
    { label: "TONO", width: 42 },
    { label: "BPM", width: 36 },
    { label: "COMPÁS", width: 46 },
    { label: "DUR.", width: 38 },
  ];
  const colsWidth = cols.reduce((a, c) => a + c.width, 0);
  const titleX = MARGIN + 30;
  const titleMax = right - colsWidth - titleX - 10;

  function drawColumnHeads() {
    let x = right - colsWidth;
    for (const col of cols) {
      page.drawText(winAnsi(col.label), { x, y, size: 7, font: fonts.sansBold, color: GREY });
      x += col.width;
    }
    page.drawText("#", { x: MARGIN, y, size: 7, font: fonts.sansBold, color: GREY });
    page.drawText("TEMA", { x: titleX, y, size: 7, font: fonts.sansBold, color: GREY });
    y -= 8;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.5, color: RULE });
    y -= 6;
  }

  if (data.notes) {
    const notes = fit(data.notes.replace(/\s+/g, " "), fonts.serif, 12, right - MARGIN);
    page.drawText(notes, { x: MARGIN, y, size: 12, font: fonts.serif, color: INK });
    y -= 20;
  }
  drawColumnHeads();

  let songNumber = 0;
  for (const item of data.items) {
    const detail =
      item.type === "SONG" && item.song
        ? [item.song.leadVocal ? `Voz: ${item.song.leadVocal}` : null, item.comment, item.song.technicalNotes]
            .filter(Boolean)
            .join(" · ")
        : "";
    const rowHeight = item.type === "SONG" ? (detail ? 40 : 30) : 24;
    if (y - rowHeight < MARGIN + 6) {
      page = doc.addPage([A4.width, A4.height]);
      pages.push(page);
      y = drawHeader(page, fonts, data, timeZone, true);
      drawColumnHeads();
    }

    if (item.type === "SONG" && item.song) {
      songNumber += 1;
      const base = y - 16;
      page.drawText(String(songNumber).padStart(2, "0"), { x: MARGIN, y: base, size: 16, font: fonts.display, color: RED });
      page.drawText(fit(item.song.title.toUpperCase(), fonts.display, 16, titleMax), {
        x: titleX,
        y: base,
        size: 16,
        font: fonts.display,
        color: INK,
      });
      if (item.song.artist) {
        const titleWidth = fonts.display.widthOfTextAtSize(fit(item.song.title.toUpperCase(), fonts.display, 16, titleMax), 16);
        const space = titleMax - titleWidth - 8;
        if (space > 40) {
          page.drawText(fit(item.song.artist, fonts.serif, 11, space), { x: titleX + titleWidth + 8, y: base + 1, size: 11, font: fonts.serif, color: GREY });
        }
      }
      const values = [
        item.song.tuning ?? "—",
        item.song.keySignature ?? "—",
        item.song.tempo ? String(item.song.tempo) : "—",
        item.song.timeSignature ?? "—",
        item.song.duration,
      ];
      let x = right - colsWidth;
      values.forEach((value, i) => {
        page.drawText(fit(winAnsi(value), fonts.sansBold, 10, cols[i].width - 4), { x, y: base + 2, size: 10, font: fonts.sansBold, color: INK });
        x += cols[i].width;
      });
      if (detail) {
        page.drawText(fit(winAnsi(detail), fonts.sans, 8.5, right - titleX), { x: titleX, y: base - 14, size: 8.5, font: fonts.sans, color: GREY });
      }
    } else {
      const label = markerLabel(item);
      const font = item.type === "ENCORE" ? fonts.display : fonts.serif;
      const text = item.type === "ENCORE" ? label.toUpperCase() : label;
      page.drawText(fit(text, font, 13, right - titleX), { x: titleX, y: y - 16, size: 13, font, color: item.type === "ENCORE" ? RED : GREY });
    }
    y -= rowHeight;
    page.drawLine({ start: { x: MARGIN, y: y + 4 }, end: { x: right, y: y + 4 }, thickness: 0.4, color: RULE });
  }
  return pages;
}

/** Genera el PDF del setlist (A4) y devuelve sus bytes. */
export async function renderSetlistPdf(
  data: SetlistPdfData,
  fontBytes: SetlistPdfFonts,
  variant: SetlistPdfVariant = "stage",
  timeZone = "Europe/Madrid",
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${data.name} — ${data.bandName}`);
  doc.setAuthor(data.bandName);
  doc.setCreator("BandManager");
  doc.setProducer("BandManager");

  const fonts: Fonts = {
    display: await doc.embedFont(fontBytes.display, { subset: true }),
    serif: await doc.embedFont(fontBytes.serif, { subset: true }),
    sans: await doc.embedFont(StandardFonts.Helvetica),
    sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const pages = variant === "stage" ? drawStage(doc, fonts, data, timeZone) : drawFull(doc, fonts, data, timeZone);
  pages.forEach((page, i) => drawFooter(page, fonts, i, pages.length));

  return doc.save();
}
