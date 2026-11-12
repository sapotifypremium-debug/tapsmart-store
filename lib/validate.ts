export type OrderInput = {
  name: string; phone: string; address: string; city: string; state: string; pin: string;
  instagram: string; notes: string; utr: string; quantity: number;
};
export function validateOrder(b: any): { ok: true; v: OrderInput } | { ok: false; errors: Record<string, string> } {
  const s = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const v: OrderInput = {
    name: s(b?.name), phone: s(b?.phone).replace(/\s/g, ""), address: s(b?.address), city: s(b?.city),
    state: s(b?.state), pin: s(b?.pin), instagram: s(b?.instagram), notes: s(b?.notes),
    utr: s(b?.utr), quantity: Number(b?.quantity),
  };
  const e: Record<string, string> = {};
  if (v.name.length < 2 || v.name.length > 80) e.name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = "Enter a 10-digit mobile number.";
  if (v.address.length < 10 || v.address.length > 300) e.address = "Enter the full delivery address (at least 10 characters).";
  if (v.city.length < 2 || v.city.length > 60) e.city = "Enter your city.";
  if (v.state.length < 2 || v.state.length > 60) e.state = "Enter your state.";
  if (!/^[1-9]\d{5}$/.test(v.pin)) e.pin = "Enter a 6-digit PIN code.";
  if (v.instagram && !/^@?[A-Za-z0-9._]{1,30}$/.test(v.instagram)) e.instagram = "Use letters, numbers, dots or underscores only.";
  if (v.notes.length > 500) e.notes = "Keep notes under 500 characters.";
  if (!/^[A-Za-z0-9]{8,22}$/.test(v.utr)) e.utr = "Enter the UTR / transaction reference from your UPI app (8–22 letters or digits).";
  if (!Number.isInteger(v.quantity) || v.quantity < 1 || v.quantity > 100000) e.quantity = "Choose a valid quantity.";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, v };
}
