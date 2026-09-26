// @vitest-environment node
import { readFileSync } from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { renderSetlistPdf, type SetlistPdfData } from "@/lib/pdf/setlist-pdf";

const fontsDir = path.resolve(__dirname, "../../src/lib/pdf/fonts");
const fonts = {
  display: new Uint8Array(readFileSync(path.join(fontsDir, "Anton-Regular.ttf"))),
  serif: new Uint8Array(readFileSync(path.join(fontsDir, "InstrumentSerif-Italic.ttf"))),
};

function song(title: string, extra: Partial<NonNullable<SetlistPdfData["items"][number]["song"]>> = {}) {
  return {
    type: "SONG" as const,
    comment: null,
    song: {
      title,
      artist: "Los Voltios",
      keySignature: "Em",
      tempo: 120,
      timeSignature: "4/4",
      leadVocal: "Marcos",
      duration: "3:45",
      technicalNotes: null,
      ...extra,
    },
  };
}

const base: SetlistPdfData = {
  bandName: "Los Voltios",
  name: "Setlist Sala Copérnico",
  notes: "Bis: Sin Frenos + Luces de Neón",
  event: { title: "Concierto Sala Copérnico", startAt: new Date("2026-10-05T19:30:00Z"), venue: "Sala Copérnico, Madrid" },
  totalDuration: "48:10",
  items: [
    song("Sin Frenos"),
    song("Canción con un título larguísimo que no cabe en una línea del escenario ni de broma"),
    { type: "BREAK", comment: "Cambio de guitarra ♪", song: null },
    song("Viento del Sur", { technicalNotes: "Capo 2 · entrada a capela → «acordes»" }),
    { type: "ENCORE", comment: null, song: null },
    song("Luces de Neón", { keySignature: null, tempo: null }),
  ],
};

async function pageCount(bytes: Uint8Array) {
  return (await PDFDocument.load(bytes)).getPageCount();
}

describe("PDF de setlist", () => {
  it("genera las dos versiones con acentos y símbolos sin romper", async () => {
    for (const variant of ["stage", "full"] as const) {
      const bytes = await renderSetlistPdf(base, fonts, variant);
      expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
      expect(await pageCount(bytes)).toBe(1);
    }
  });

  it("pagina los setlists muy largos", async () => {
    const items = Array.from({ length: 60 }, (_, i) => song(`Tema ${i + 1}`));
    expect(await pageCount(await renderSetlistPdf({ ...base, items }, fonts, "full"))).toBeGreaterThan(1);
    expect(await pageCount(await renderSetlistPdf({ ...base, items }, fonts, "stage"))).toBeGreaterThan(1);
  });

  it("funciona sin evento, sin notas y sin canciones", async () => {
    const bytes = await renderSetlistPdf({ ...base, event: null, notes: null, items: [] }, fonts, "full");
    expect(await pageCount(bytes)).toBe(1);
  });
});
