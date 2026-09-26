import { describe, expect, it } from "vitest";
import {
  checkLine,
  initials,
  isDue,
  lineKey,
  modeWeight,
  nextMastery,
  nextReviewDate,
  pickGaps,
  practiceLines,
  reviewPriority,
  sameWord,
  words,
} from "@/lib/lyrics/practice";

// Letra inventada para las pruebas
const LYRICS = "[Estrofa 1]\nCruzo la avenida con prisa\nbuscando un bar que no cierra\n\n[Estribillo]\nFarolas de cartón\n\nalumbran mi canción";

describe("practiceLines", () => {
  it("devuelve los versos con su sección y el inicio de cada estrofa", () => {
    expect(practiceLines(LYRICS)).toEqual([
      { index: 0, text: "Cruzo la avenida con prisa", section: "Estrofa 1", startsStanza: true },
      { index: 1, text: "buscando un bar que no cierra", section: "Estrofa 1", startsStanza: false },
      { index: 2, text: "Farolas de cartón", section: "Estribillo", startsStanza: true },
      { index: 3, text: "alumbran mi canción", section: "Estribillo", startsStanza: true },
    ]);
  });
});

describe("checkLine", () => {
  it("da por buena la línea ignorando tildes, mayúsculas y signos", () => {
    const result = checkLine("¡Farolas de cartón!", "farolas de carton");
    expect(result.score).toBe(1);
    expect(result.extra).toEqual([]);
  });

  it("marca las palabras que faltan o cambian", () => {
    const result = checkLine("Cruzo la avenida con prisa", "cruzo la calle con prisa");
    expect(result.expected.map((w) => w.ok)).toEqual([true, true, false, true, true]);
    expect(result.extra).toEqual(["calle"]);
    expect(result.score).toBe(0.7);
  });

  it("no premia escribir de más", () => {
    expect(checkLine("uno dos", "uno dos tres cuatro").score).toBe(0.5);
    expect(checkLine("uno dos", "").score).toBe(0);
  });
});

describe("huecos e iniciales", () => {
  it("oculta al menos una palabra, de forma reproducible", () => {
    const line = "Cruzo la avenida con prisa";
    expect(pickGaps(line, 0.1, 7)).toHaveLength(1);
    expect(pickGaps(line, 0.5, 7)).toEqual(pickGaps(line, 0.5, 7));
    expect(pickGaps(line, 1, 7)).toEqual([0, 1, 2, 3, 4]);
    expect(pickGaps("", 0.5, 1)).toEqual([]);
  });

  it("compara palabras sueltas", () => {
    expect(sameWord("cartón", "Carton")).toBe(true);
    expect(sameWord("cartón", "")).toBe(false);
  });

  it("deja solo la inicial de cada palabra con su puntuación", () => {
    expect(initials("Cruzo la avenida, con prisa")).toBe("C l a, c p");
    expect(initials("¡Farolas de cartón!")).toBe("¡F d c!");
  });

  it("identifica los versos sin importar signos", () => {
    expect(lineKey("¡Farolas de  cartón!")).toBe("farolas de carton");
    expect(words("  hola ,  qué tal ")).toEqual(["hola", "qué", "tal"]);
  });
});

describe("dominio y repaso", () => {
  it("pondera modos y mezcla la práctica reciente", () => {
    expect(modeWeight("read")).toBe(0);
    expect(modeWeight("memory")).toBe(1);
    expect(modeWeight("gaps", 1)).toBeCloseTo(0.95);
    expect(nextMastery(null, 0, 0.8)).toBe(80);
    expect(nextMastery(40, 3, 1)).toBe(70);
  });

  it("espacia el repaso según el dominio", () => {
    const from = new Date("2026-10-01T10:00:00Z");
    expect(nextReviewDate(30, from).toISOString()).toBe("2026-10-02T10:00:00.000Z");
    expect(nextReviewDate(97, from).toISOString()).toBe("2026-10-15T10:00:00.000Z");
  });

  it("prioriza el bolo cercano, lo nunca practicado y lo pendiente", () => {
    const now = new Date("2026-10-01T10:00:00Z");
    const gig = { songId: "a", mastery: 60, nextReviewAt: new Date("2026-10-05"), daysToGig: 2 };
    const due = { songId: "b", mastery: 60, nextReviewAt: new Date("2026-09-28"), daysToGig: null };
    const known = { songId: "c", mastery: 95, nextReviewAt: new Date("2026-10-10"), daysToGig: null };
    const never = { songId: "d", mastery: null, nextReviewAt: null, daysToGig: null };
    const order = [known, due, never, gig].sort((x, y) => reviewPriority(y, now) - reviewPriority(x, now));
    expect(order.map((c) => c.songId)).toEqual(["a", "d", "b", "c"]);
    expect(isDue(gig, now)).toBe(true);
    expect(isDue(known, now)).toBe(false);
  });
});
