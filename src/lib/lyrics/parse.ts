/**
 * Lectura de letras a partir del texto de un documento (Word, PDF, txt):
 * separa metadatos (tonalidad, BPM), secciones, acordes y letra. Sin
 * dependencias para poder usarse en el navegador y en los tests.
 */

export type ParsedLyrics = {
  /** Título detectado (primera línea o nombre del archivo). */
  title: string;
  /** Tonalidad normalizada en notación americana ("Am", "F#", "Bb"). */
  keySignature: string | null;
  /** Lo que ponía el documento, para enseñarlo en la revisión ("Mi menor"). */
  keyRaw: string | null;
  tempo: number | null;
  /** Letra limpia: sin acordes ni metadatos, con secciones como "[Estribillo]". */
  lyrics: string;
  /** Hoja con acordes tal cual venía (solo si había acordes). */
  chords: string | null;
  lineCount: number;
};

const NOTE_ES: Record<string, string> = { do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", si: "B" };

/** "Mi menor", "Lam", "Fa#", "E minor", "Bb" → "Em", "Am", "F#", "E m"… */
export function normalizeKey(raw: string): string | null {
  const text = raw
    .trim()
    .replace(/[.,;)\]]+$/, "")
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .replace(/\s+/g, " ");
  if (!text) return null;

  const es = /^(do|re|mi|fa|sol|la|si)\s*(#|b|sostenido|bemol)?\s*(m|menor|min|mayor|maj|mayor)?$/i.exec(text);
  const en = /^([a-g])\s*(#|b|sharp|flat)?\s*(m|min|minor|maj|major)?$/i.exec(text);
  let note: string;
  let accidental: string | undefined;
  let quality: string | undefined;
  if (es) {
    note = NOTE_ES[es[1].toLowerCase()];
    [, , accidental, quality] = es;
  } else if (en) {
    note = en[1].toUpperCase();
    [, , accidental, quality] = en;
  } else {
    return null;
  }

  const acc = accidental?.toLowerCase();
  const sign = acc === "#" || acc === "sostenido" || acc === "sharp" ? "#" : acc === "b" || acc === "bemol" || acc === "flat" ? "b" : "";
  const q = quality?.toLowerCase();
  const minor = q === "m" || q === "menor" || q === "min" || q === "minor";
  return `${note}${sign}${minor ? "m" : ""}`;
}

export function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** "03 - Sin frenos (v2).docx" → "Sin frenos" */
export function titleFromFilename(filename: string) {
  return (
    filename
      .replace(/^.*[\\/]/, "")
      .replace(/\.[a-z0-9]{2,4}$/i, "")
      .replace(/[_]+/g, " ")
      // "03 - ", "3. ", "02 " (pista); no toca títulos como "22 de abril"
      .replace(/^\s*(?:\d{1,3}\s*[-.)]\s*|0\d\s+)/, "")
      .replace(/\s*\((?:v\d+|final|def(?:initiva)?|copia)\)\s*$/i, "")
      .trim() || filename
  );
}

const KEY_LINE = /^\s*(?:tono|tonalidad|t[oó]nica|key|tonality)\s*[:=\-–]?\s*(.{1,24}?)\s*$/i;
const KEY_INLINE = /\b(?:tono|tonalidad|key)\s*[:=]\s*([A-Za-zÁÉÍÓÚáéíóú#♯♭ ]{1,16}?)\s*(?:[)\]\-–·|,]|$)/i;
const TEMPO_RE = /(?:\b(\d{2,3})\s*bpm\b|\btempo\s*[:=]?\s*(\d{2,3})\b)/i;
const META_LINE =
  /^\s*(?:tono|tonalidad|t[oó]nica|key|tonality|tempo|bpm|capo|cejilla|comp[aá]s|autor(?:es)?|letra|m[uú]sica|compositor(?:es)?|t[ií]tulo|afinaci[oó]n)\b\s*[:=\-–]/i;
const SECTION_RE =
  /^\s*[[(]?\s*((?:pre[\s-]?)?(?:intro|estrofa|verso|verse|estribillo|coro|chorus|puente|bridge|solo|outro|final|instrumental|interludio|break|hook))(\s*\d{1,2})?\s*(?:x\s*\d)?\s*[\])]?\s*:?\s*$/i;

const CHORD_EN = /^[A-G](?:#|b)?(?:m|min|maj|dim|aug|sus|add|M|º|°|\+)?\d{0,2}(?:(?:sus|add|maj|b|#)\d{1,2})*(?:\/[A-G](?:#|b)?)?$/;
const CHORD_ES = /^(?:Do|Re|Mi|Fa|Sol|La|Si)(?:#|b)?(?:m|maj|dim|aug|sus|add|º|°|\+)?\d{0,2}(?:\/(?:Do|Re|Mi|Fa|Sol|La|Si)(?:#|b)?)?$/;
const INLINE_CHORD = /\[([A-G](?:#|b)?[^\]\s]{0,8}|(?:Do|Re|Mi|Fa|Sol|La|Si)(?:#|b)?[^\]\s]{0,6})\]/g;

function isChordToken(token: string) {
  return CHORD_EN.test(token) || CHORD_ES.test(token);
}

/** Línea solo de acordes ("Am   G   F  (x2)", "| Do | Sol |"). */
export function isChordLine(line: string) {
  const tokens = line
    .replace(/[|()]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !/^(?:x\d|\d+x|-+|\/+|%)$/i.test(t));
  if (tokens.length === 0 || !tokens.every(isChordToken)) return false;
  // Una sola palabra tipo "La", "Mi", "Si" o "A" puede ser letra: exige algo más
  if (tokens.length === 1) return /[#b\dm/+°º]|maj|sus|dim|aug/.test(tokens[0].slice(1)) || /\s{2,}|\|/.test(line);
  return true;
}

function cleanDocument(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[​﻿]/g, "")
    .replace(/\t/g, "    ")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""));
}

function sectionLabel(match: RegExpExecArray) {
  const name = match[1].replace(/\s+/g, " ").trim();
  const label = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return `[${label}${match[2] ? ` ${match[2].trim()}` : ""}]`;
}

function collapseBlankLines(lines: string[]) {
  const out: string[] = [];
  for (const line of lines) {
    if (!line.trim() && (out.length === 0 || !out[out.length - 1].trim())) continue;
    out.push(line);
  }
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

/** Una canción a partir de sus líneas. */
function parseSong(lines: string[], fallbackTitle: string, titleIsFirstLine: boolean): ParsedLyrics {
  let keyRaw: string | null = null;
  let tempo: number | null = null;
  let hasChords = false;
  const lyricLines: string[] = [];
  const chordLines: string[] = [];

  let body = lines;
  let title = fallbackTitle;
  const firstIndex = lines.findIndex((l) => l.trim());
  if (titleIsFirstLine && firstIndex >= 0) {
    title = lines[firstIndex].trim();
    body = lines.slice(firstIndex + 1);
  }

  // Metadatos en la línea del título: "Sin frenos (Tono: Am)"
  const inline = KEY_INLINE.exec(title);
  if (inline) {
    keyRaw = inline[1].trim();
    title = title.slice(0, inline.index).replace(/[\s(\[\-–·|,]+$/, "").trim() || fallbackTitle;
  }

  for (const raw of body) {
    const line = raw.trim();
    const keyMatch = KEY_LINE.exec(line) ?? (META_LINE.test(line) ? KEY_INLINE.exec(line) : null);
    if (keyMatch && !keyRaw && normalizeKey(keyMatch[1])) keyRaw = keyMatch[1].trim();
    const tempoMatch = TEMPO_RE.exec(line);
    if (tempoMatch && META_LINE.test(line) && !tempo) tempo = Number(tempoMatch[1] ?? tempoMatch[2]);
    if (META_LINE.test(line) || (keyMatch && normalizeKey(keyMatch[1]))) {
      continue;
    }

    const section = SECTION_RE.exec(line);
    if (section) {
      const label = sectionLabel(section);
      lyricLines.push("", label);
      chordLines.push("", label);
      continue;
    }

    if (line && isChordLine(line)) {
      hasChords = true;
      chordLines.push(raw);
      continue;
    }

    if (INLINE_CHORD.test(line)) {
      hasChords = true;
      chordLines.push(raw);
      lyricLines.push(line.replace(INLINE_CHORD, "").replace(/\s{2,}/g, " ").trim());
      INLINE_CHORD.lastIndex = 0;
      continue;
    }
    INLINE_CHORD.lastIndex = 0;

    lyricLines.push(line);
    chordLines.push(raw);
  }

  const lyrics = collapseBlankLines(lyricLines).join("\n");
  return {
    title,
    keySignature: keyRaw ? normalizeKey(keyRaw) : null,
    keyRaw,
    tempo: tempo && tempo >= 30 && tempo <= 300 ? tempo : null,
    lyrics,
    chords: hasChords ? collapseBlankLines(chordLines).join("\n") : null,
    lineCount: lyrics.split("\n").filter((l) => l.trim() && !l.startsWith("[")).length,
  };
}

/**
 * Lee un documento. Si contiene varios títulos de canciones conocidas en
 * líneas sueltas (un "Letras completas.docx"), lo divide en varias.
 */
export function parseLyricsDocument(text: string, filename: string, knownTitles: string[] = []): ParsedLyrics[] {
  const lines = cleanDocument(text);
  const known = new Set(knownTitles.map(normalizeTitle).filter(Boolean));
  const fileTitle = titleFromFilename(filename);

  const titleOf = (line: string) => {
    const withoutKey = line.replace(KEY_INLINE, "").replace(/[\s(\[\-–·|,]+$/, "");
    return normalizeTitle(withoutKey);
  };
  const isStandalone = (i: number) => lines[i].trim().length > 0 && lines[i].trim().length <= 80;
  const starts = lines
    .map((line, i) => (isStandalone(i) && known.has(titleOf(line)) ? i : -1))
    .filter((i) => i >= 0);

  if (starts.length >= 2) {
    // Lo que haya antes del primer título (cabecera del documento) se descarta
    return starts
      .map((start, n) => parseSong(lines.slice(start, starts[n + 1] ?? lines.length), fileTitle, true))
      .filter((song) => song.lyrics.trim());
  }

  const first = lines.find((l) => l.trim())?.trim() ?? "";
  const firstNorm = titleOf(first);
  const titleIsFirstLine =
    Boolean(first) &&
    (firstNorm === normalizeTitle(fileTitle) || known.has(firstNorm) || KEY_INLINE.test(first));
  return [parseSong(lines, fileTitle, titleIsFirstLine)];
}

/** Canción del catálogo que corresponde a un título (exacto o contenido). */
export function matchSong<T extends { id: string; title: string }>(title: string, songs: T[]): T | null {
  const target = normalizeTitle(title);
  if (!target) return null;
  const exact = songs.find((s) => normalizeTitle(s.title) === target);
  if (exact) return exact;
  const candidates = songs.filter((s) => {
    const t = normalizeTitle(s.title);
    return t.length >= 4 && (target.includes(t) || t.includes(target));
  });
  return candidates.length === 1 ? candidates[0] : null;
}
