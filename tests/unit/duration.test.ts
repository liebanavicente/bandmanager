import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatTotalDuration,
  parseDurationInput,
  setlistSeconds,
  sumDurations,
} from "@/lib/duration";

describe("duration", () => {
  it("formatea duración en mm:ss", () => {
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(null)).toBe("—");
  });

  it("suma duraciones de repertorio", () => {
    expect(sumDurations([180, 240, null, 60])).toBe(480);
  });

  it("formatea duración total con horas", () => {
    expect(formatTotalDuration(3665)).toBe("1h 1m");
  });
});
describe("parseDurationInput", () => {
  it("entiende minutos y minutos:segundos", () => {
    expect(parseDurationInput("2")).toBe(120);
    expect(parseDurationInput("1:30")).toBe(90);
    expect(parseDurationInput(" 0:45 ")).toBe(45);
  });

  it("ignora vacíos y rechaza lo que no es una duración", () => {
    expect(parseDurationInput("")).toBeUndefined();
    expect(parseDurationInput("dos")).toBeUndefined();
    expect(parseDurationInput("1:3:0")).toBeUndefined();
  });
});

describe("setlistSeconds", () => {
  it("suma canciones con su duración y pausas con la prevista", () => {
    expect(
      setlistSeconds([
        { type: "SONG", song: { durationSeconds: 200 } },
        { type: "BREAK", durationSeconds: 60 },
        { type: "SONG", song: { durationSeconds: null } },
        { type: "ENCORE", durationSeconds: null },
        { type: "SONG", durationSeconds: 999, song: { durationSeconds: 180 } },
      ]),
    ).toBe(440);
  });
});
