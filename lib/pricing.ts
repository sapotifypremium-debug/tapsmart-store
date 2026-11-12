export type Tier = { min: number; max: number; price: number };
export const DEFAULT_TIERS: Tier[] = [
  { min: 1, max: 15, price: 299 },
  { min: 16, max: 30, price: 285 },
  { min: 31, max: 50, price: 250 },
  { min: 100, max: 100, price: 200 },
];
/** Returns per-card price, or null when the quantity needs a bulk quote. */
export function priceFor(qty: number, tiers: Tier[]): number | null {
  if (!Number.isInteger(qty) || qty < 1) return null;
  return tiers.find((t) => qty >= t.min && qty <= t.max)?.price ?? null;
}
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export function tierLabel(t: Tier) {
  return t.min === t.max ? `Exactly ${t.min}` : `${t.min}–${t.max}`;
}
