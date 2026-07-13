export type StockItem = {
  stock: number;
  minStock: number;
  name: string;
};

export function isLowStock(stock: number, minStock: number): boolean {
  return stock < minStock;
}

export function getLowStockItems(items: StockItem[]): StockItem[] {
  return items.filter((item) => isLowStock(item.stock, item.minStock));
}

export function adjustStock(current: number, delta: number): number {
  const next = current + delta;
  if (next < 0) {
    throw new Error("INSUFFICIENT_STOCK");
  }
  return next;
}