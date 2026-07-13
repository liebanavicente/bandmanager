import { describe, expect, it } from "vitest";
import { formatDuration, formatTotalDuration, sumDurations } from "@/lib/duration";

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