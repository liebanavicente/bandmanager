/**
 * Lógica de la práctica de letras (sin dependencias): versos, corrección de
 * lo que se escribe, huecos, iniciales y repaso espaciado.
 */

export type PracticeMode = "read" | "gaps" | "initials" | "memory";

export type PracticeLine = {
  /** Posición entre los versos (sin secciones ni líneas vacías). */
  index: number;
  text: string;
  /** Sección en la que está ("Estribillo"), si la letra las marca. */
  section: string | null;
  /** Primer verso de una estrofa (después de un hueco o una sección). */
  startsStanza: boolean;
};

const SECTION = /^\s*\[(.+)\]\s*$/;

export function practiceLines(lyrics: string): PracticeLine[] {
  const lines: PracticeLine[] = [];
  let section: string | null = null;
  let newStanza = true;
  for (const raw of lyrics.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const header = SECTION.exec(line);
    if (header) {
      section = header[1].trim();
      newStanza = true;
      continue;
    }
    if (!line) {
      newStanza = true;
      continue;
    }
    lines.push({ index: lines.length, text: line, section, startsStanza: newStanza });
    newStanza = false;
  }
  return lines;
}

/** Palabra comparable: sin tildes, mayúsculas ni signos ("¡Olé!" → "ole"). */
export function normalizeWord(word: string) {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]/g, "");
}

export function words(line: string) {
  return line.split(/\s+/).filter((w) => normalizeWord(w));
}

/** Clave estable de un verso para guardar cuáles se fallan. */
export function lineKey(line: string) {
  return words(line).map(normalizeWord).join(" ");
}

export type WordResult = { word: string; ok: boolean };

export type LineCheck = {
  /** Palabras del verso correcto, marcando las que se acertaron. */
  expected: WordResult[];
  /** Palabras escritas que sobran o no están en el verso. */
  extra: string[];
  /** 0-1 */
  score: number;
};

/**
 * Compara lo escrito con el verso (subsecuencia común más larga): cuenta las
 * palabras correctas en su orden y penaliza las que sobran.
 */
export function checkLine(expectedLine: string, typed: string): LineCheck {
  const exp = words(expectedLine);
  const got = words(typed);
  const a = exp.map(normalizeWord);
  const b = got.map(normalizeWord);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const okExp = new Array<boolean>(a.length).fill(false);
  const okGot = new Array<boolean>(b.length).fill(false);
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) {
      okExp[i] = okGot[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const matched = okExp.filter(Boolean).length;
  const extra = got.filter((_, j) => !okGot[j]);
  const score = a.length === 0 ? 1 : Math.max(0, matched - extra.length * 0.5) / a.length;
  return {
    expected: exp.map((word, i) => ({ word, ok: okExp[i] })),
    extra,
    score: Math.round(score * 100) / 100,
  };
}

/** Comprueba una palabra de un hueco. */
export function sameWord(expected: string, typed: string) {
  return normalizeWord(expected) === normalizeWord(typed) && normalizeWord(typed) !== "";
}

/** Generador pseudoaleatorio reproducible (mismos huecos al repetir un verso). */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Índices de las palabras que se ocultan (al menos una por verso). */
export function pickGaps(line: string, ratio: number, seed: number): number[] {
  const list = words(line);
  const candidates = list.map((w, i) => ({ i, len: normalizeWord(w).length })).filter((w) => w.len > 0);
  if (candidates.length === 0) return [];
  const count = Math.min(candidates.length, Math.max(1, Math.round(candidates.length * ratio)));
  const random = seeded(seed);
  // Se prefieren palabras con contenido (las de 1-2 letras se eligen menos)
  const weighted = candidates
    .map((c) => ({ ...c, order: random() / (c.len <= 2 ? 0.35 : 1) }))
    .sort((x, y) => x.order - y.order);
  return weighted
    .slice(0, count)
    .map((c) => c.i)
    .sort((x, y) => x - y);
}

/** "Cruzo la avenida, con prisa" → "C l a, c p" */
export function initials(line: string) {
  return line
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      const match = /^([^\p{L}\p{N}]*)([\p{L}\p{N}])[\p{L}\p{N}'’]*(.*)$/u.exec(token);
      return match ? `${match[1]}${match[2]}${match[3]}` : token;
    })
    .join("");
}

/** Cuánto cuenta cada modo para el dominio (leer no puntúa). */
export function modeWeight(mode: PracticeMode, gapRatio = 0.5) {
  switch (mode) {
    case "memory":
      return 1;
    case "initials":
      return 0.85;
    case "gaps":
      return 0.55 + Math.min(1, Math.max(0, gapRatio)) * 0.4;
    default:
      return 0;
  }
}

/** Nuevo dominio 0-100: la práctica reciente pesa la mitad. */
export function nextMastery(previous: number | null, attempts: number, effectiveScore: number) {
  const score = Math.round(Math.min(1, Math.max(0, effectiveScore)) * 100);
  if (previous === null || attempts === 0) return score;
  return Math.round(previous * 0.5 + score * 0.5);
}

const DAY = 24 * 60 * 60 * 1000;

/** Repaso espaciado: cuanto mejor te la sabes, más tarde vuelve. */
export function nextReviewDate(mastery: number, from = new Date()) {
  const days = mastery < 50 ? 1 : mastery < 70 ? 2 : mastery < 85 ? 4 : mastery < 95 ? 7 : 14;
  return new Date(from.getTime() + days * DAY);
}

export type ReviewCandidate = {
  songId: string;
  mastery: number | null;
  nextReviewAt: Date | null;
  /** Días hasta el próximo bolo en el que suena (null si no está en ninguno). */
  daysToGig: number | null;
};

/**
 * Prioridad de repaso (mayor = antes): el bolo cercano manda, luego lo que
 * toca repasar y lo que peor te sabes. Lo nunca practicado va arriba.
 */
export function reviewPriority(c: ReviewCandidate, now = new Date()) {
  const mastery = c.mastery ?? 0;
  let score = (100 - mastery) / 100; // 0-1
  if (c.mastery === null) score += 0.6;
  if (c.nextReviewAt && c.nextReviewAt.getTime() <= now.getTime()) {
    const overdue = (now.getTime() - c.nextReviewAt.getTime()) / DAY;
    score += 0.5 + Math.min(overdue, 14) / 28;
  }
  if (c.daysToGig !== null && c.daysToGig >= 0 && c.daysToGig <= 30) {
    // Bolo en 1 día ≈ +2, en 30 días ≈ +0.3; y más si no te la sabes bien
    score += (2 - (c.daysToGig / 30) * 1.7) * (mastery < 90 ? 1 : 0.3);
  }
  return Math.round(score * 1000) / 1000;
}

export function isDue(c: ReviewCandidate, now = new Date()) {
  return (
    c.mastery === null ||
    (c.nextReviewAt !== null && c.nextReviewAt.getTime() <= now.getTime()) ||
    (c.daysToGig !== null && c.daysToGig <= 7 && (c.mastery ?? 0) < 90)
  );
}
