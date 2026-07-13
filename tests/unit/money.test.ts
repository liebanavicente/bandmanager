import { describe, expect, it } from "vitest";
import {
  calculateMarginPercent,
  calculateOrderTotal,
  centsToEuros,
  eurosToCents,
} from "@/lib/money";

describe("money", () => {
  it("convierte céntimos a euros", () => {
    expect(centsToEuros(2500)).toContain("25");
  });

  it("convierte euros a céntimos", () => {
    expect(eurosToCents(19.99)).toBe(1999);
  });

  it("calcula total de pedido", () => {
    const result = calculateOrderTotal(
      [
        { quantity: 2, unitPriceCents: 2500 },
        { quantity: 1, unitPriceCents: 1500 },
      ],
      450,
    );
    expect(result.subtotalCents).toBe(6500);
    expect(result.totalCents).toBe(6950);
  });

  it("calcula margen", () => {
    expect(calculateMarginPercent(2500, 900)).toBe(64);
  });
});