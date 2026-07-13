import { describe, expect, it } from "vitest";
import { adjustStock, getLowStockItems, isLowStock } from "@/lib/stock";

describe("stock", () => {
  it("detecta stock bajo", () => {
    expect(isLowStock(3, 10)).toBe(true);
    expect(isLowStock(10, 10)).toBe(false);
  });

  it("lista productos con stock bajo", () => {
    const items = getLowStockItems([
      { name: "Camiseta M", stock: 2, minStock: 10 },
      { name: "Vinilo", stock: 20, minStock: 8 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Camiseta M");
  });

  it("ajusta stock sin negativos", () => {
    expect(adjustStock(10, -3)).toBe(7);
    expect(() => adjustStock(2, -5)).toThrow("INSUFFICIENT_STOCK");
  });
});