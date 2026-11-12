"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Settings } from "@/lib/settings";
import type { Tier } from "@/lib/pricing";
import { inr } from "@/lib/pricing";

const STATUSES = ["Pending", "Payment Verified", "Processing", "Shipped", "Delivered", "Cancelled"];
type Order = any;

export default function AdminPanel({ orders, settings, dbReady }: { orders: Order[]; settings: Settings; dbReady: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "settings">("orders");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [tiers, setTiers] = useState<Tier[]>(settings.tiers);
  const [s, setS] = useState({ delivery: settings.delivery_charge === null ? "" : String(settings.delivery_charge), upi: settings.upi_id, wa: settings.whatsapp_number, ig: settings.instagram_url });

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? orders.filter((o) => [o.order_no, o.name, o.phone, o.city, o.utr, o.status].join(" ").toLowerCase().includes(t)) : orders;
  }, [orders, q]);

  async function patch(id: string, body: object) {
    const r = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(r.ok ? "Order updated." : (await r.json()).error || "Update failed."); if (r.ok) router.refresh();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tiers, delivery_charge: s.delivery === "" ? null : Number(s.delivery), upi_id: s.upi, whatsapp_number: s.wa, instagram_url: s.ig }) });
    setMsg(r.ok ? "Settings saved." : (await r.json()).error || "Save failed."); if (r.ok) router.refresh();
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); location.href = "/admin/login"; }
  const setTier = (i: number, k: keyof Tier, v: string) => setTiers((t) => t.map((x, j) => (j === i ? { ...x, [k]: Number(v) || 0 } : x)));

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">TapSmart admin</h1>
        <div className="flex gap-2">
          {(["orders", "settings"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 ${tab === t ? "bg-gold-400 font-semibold text-navy-950" : "border border-navy-700"}`}>{t === "orders" ? "Orders" : "Settings"}</button>
          ))}
          <button onClick={logout} className="rounded-full border border-navy-700 px-5 py-2">Sign out</button>
        </div>
      </div>
      {!dbReady && <p className="mt-4 rounded-2xl border border-[#f08a7e]/50 p-3 text-[#f3a79e]">Database is not connected. Add the Supabase keys to your environment variables.</p>}
      {msg && <p className="mt-4 rounded-2xl border border-gold-400/40 p-3 text-gold-300" role="status">{msg}</p>}

      {tab === "orders" ? (
        <section className="mt-6">
          <input aria-label="Search orders" placeholder="Search by order no, name, phone, city, UTR or status" value={q} onChange={(e) => setQ(e.target.value)} className="field" />
          <p className="mt-2 text-sm text-ivory/60">{shown.length} order(s)</p>
          <ul className="mt-4 space-y-3">
            {shown.map((o) => (
              <li key={o.id} className="rounded-3xl border border-navy-700 bg-navy-900 p-5">
                <button className="flex w-full flex-wrap items-center justify-between gap-2 text-left" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
                  <span><b>#{o.order_no}</b> {o.name} · {o.quantity} cards · <span className="text-gold-300">{inr(o.total)}</span></span>
                  <span className="text-sm">{o.status}{o.payment_verified ? " · paid ✓" : " · payment unverified"}</span>
                </button>
                {open === o.id && (
                  <div className="mt-4 grid gap-4 border-t border-navy-700 pt-4 md:grid-cols-2">
                    <div className="space-y-1 text-sm text-ivory/85">
                      <p>Phone: {o.phone}</p>
                      <p>Address: {o.address}, {o.city}, {o.state} – {o.pin}</p>
                      <p>Instagram: {o.instagram || "–"}</p>
                      <p>Notes: {o.notes || "–"}</p>
                      <p>UTR: <b>{o.utr}</b></p>
                      <p>{o.quantity} × {inr(o.unit_price)} = {inr(o.subtotal)} + delivery {inr(o.delivery_charge)} = <b>{inr(o.total)}</b></p>
                      <p className="text-ivory/50">Placed {new Date(o.created_at).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="space-y-3">
                      <label htmlFor={`st-${o.id}`}>Order status</label>
                      <select id={`st-${o.id}`} className="field" value={o.status} onChange={(e) => patch(o.id, { status: e.target.value })}>
                        {STATUSES.map((st) => <option key={st}>{st}</option>)}
                      </select>
                      {!o.payment_verified
                        ? <button onClick={() => patch(o.id, { payment_verified: true })} className="rounded-full bg-gold-400 px-5 py-2 font-semibold text-navy-950">Mark payment verified</button>
                        : <button onClick={() => patch(o.id, { payment_verified: false, status: "Pending" })} className="rounded-full border border-navy-700 px-5 py-2">Undo verification</button>}
                      <a className="block text-sm underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/91${o.phone}`}>Message customer on WhatsApp</a>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {!shown.length && <li className="text-ivory/60">No orders yet.</li>}
          </ul>
        </section>
      ) : (
        <form onSubmit={save} className="mt-6 space-y-6">
          <fieldset className="rounded-3xl border border-navy-700 bg-navy-900 p-5">
            <legend className="px-2 font-semibold">Price per card</legend>
            {tiers.map((t, i) => (
              <div key={i} className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                <div><label>From</label><input className="field" inputMode="numeric" value={t.min} onChange={(e) => setTier(i, "min", e.target.value)} /></div>
                <div><label>To</label><input className="field" inputMode="numeric" value={t.max} onChange={(e) => setTier(i, "max", e.target.value)} /></div>
                <div><label>Price ₹</label><input className="field" inputMode="numeric" value={t.price} onChange={(e) => setTier(i, "price", e.target.value)} /></div>
                <button type="button" aria-label="Remove band" onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="h-11 rounded-full border border-navy-700 px-3">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => setTiers([...tiers, { min: 1, max: 1, price: 1 }])} className="mt-4 rounded-full border border-gold-400 px-4 py-2 text-gold-300">Add price band</button>
            <p className="mt-2 text-sm text-ivory/60">Quantities outside every band show “Contact for Bulk Pricing”.</p>
          </fieldset>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label htmlFor="dc">Delivery charge (₹, 0 = free, empty = not set)</label><input id="dc" className="field" inputMode="numeric" value={s.delivery} onChange={(e) => setS({ ...s, delivery: e.target.value })} /></div>
            <div><label htmlFor="upi">UPI ID</label><input id="upi" className="field" placeholder="name@bank" value={s.upi} onChange={(e) => setS({ ...s, upi: e.target.value })} /></div>
            <div><label htmlFor="wa">WhatsApp number (with country code)</label><input id="wa" className="field" value={s.wa} onChange={(e) => setS({ ...s, wa: e.target.value })} /></div>
            <div><label htmlFor="ig">Instagram link</label><input id="ig" className="field" value={s.ig} onChange={(e) => setS({ ...s, ig: e.target.value })} /></div>
          </div>
          <button className="rounded-full bg-gold-400 px-8 py-3 font-bold text-navy-950">Save settings</button>
        </form>
      )}
    </main>
  );
}
