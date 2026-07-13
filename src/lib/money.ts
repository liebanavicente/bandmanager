export function centsToEuros(cents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function calculateMarginPercent(priceCents: number, costCents: number): number {
  if (priceCents <= 0) return 0;
  return Math.round(((priceCents - costCents) / priceCents) * 100);
}

export function calculateOrderTotal(
  items: { quantity: number; unitPriceCents: number }[],
  shippingCents = 0,
): { subtotalCents: number; totalCents: number } {
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  return { subtotalCents, totalCents: subtotalCents + shippingCents };
}