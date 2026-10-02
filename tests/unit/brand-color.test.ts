import { describe, expect, it } from "vitest";
import {
  BAND_COLOR_PRESETS,
  DEFAULT_BAND_COLOR,
  bandPalette,
  contrast,
  dominantColor,
  normalizeHex,
} from "@/lib/brand-color";

const PAPER = "#F7F7F3";
const INK = "#090909";

describe("normalizeHex", () => {
  it("acepta #rgb y #rrggbb, con o sin almohadilla", () => {
    expect(normalizeHex("#d7ff00")).toBe("#D7FF00");
    expect(normalizeHex("f00")).toBe("#FF0000");
    expect(normalizeHex(" #AbC ")).toBe("#AABBCC");
  });

  it("rechaza lo que no es un hex", () => {
    expect(normalizeHex("rojo")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex(null)).toBeNull();
  });
});

describe("bandPalette", () => {
  it("usa el acento por defecto si no hay color", () => {
    expect(bandPalette(null).base).toBe(DEFAULT_BAND_COLOR);
  });

  it("elige tinta sobre colores claros y blanco sobre oscuros", () => {
    expect(bandPalette("#D7FF00").ink).toBe(INK);
    expect(bandPalette("#2F5BFF").ink).toBe("#FFFFFF");
  });

  it.each(BAND_COLOR_PRESETS.map((p) => [p.name, p.value]))(
    "%s se lee sobre el papel y sobre el escenario",
    (_, value) => {
      const p = bandPalette(value);
      expect(contrast(p.text, PAPER)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.display, PAPER)).toBeGreaterThanOrEqual(3);
      expect(contrast(p.bright, INK)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.base, p.ink)).toBeGreaterThanOrEqual(3);
    },
  );
});

describe("dominantColor", () => {
  function pixels(...colors: [number, number, number, number, number][]) {
    const out: number[] = [];
    for (const [r, g, b, a, count] of colors) {
      for (let i = 0; i < count; i++) out.push(r, g, b, a);
    }
    return out;
  }

  it("ignora fondo blanco, trazo negro y transparencias", () => {
    const color = dominantColor(
      pixels([255, 255, 255, 255, 500], [0, 0, 0, 255, 300], [10, 200, 60, 0, 400], [224, 48, 30, 255, 80]),
    );
    expect(color).toBe("#E0301E");
  });

  it("devuelve null para un logo monocromo", () => {
    expect(dominantColor(pixels([255, 255, 255, 255, 50], [30, 30, 30, 255, 50]))).toBeNull();
  });
});
