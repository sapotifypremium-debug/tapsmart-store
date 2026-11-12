
"use client";
import { useEffect, useMemo, useState } from "react";
import type { Settings } from "@/lib/settings";
import { inr, priceFor, tierLabel } from "@/lib/pricing";

type Form = { name: string; phone: string; address: string; city: string; state: string; pin: string; instagram: string; notes: string; utr: string };

// Original payment QR supplied by the user.
const PAYMENT_QR: string | null = "/scanner-qr.jpg";

const EMPTY: Form = { name: "", phone: "", address: "", city: "", state: "", pin: "", instagram: "", notes: "", utr: "" };

const LEARN = [
  { id: "works", title: "How TapSmart NFC works", body: "Hold a phone near the card. The phone reads the chip and opens your TapSmart page instantly. No app and no typing needed. Works on most modern Android phones and iPhones." },
  { id: "qr", title: "How to scan the QR code", body: "Open the phone camera, point it at the QR code printed on the card and tap the link that appears. It opens the same page as the NFC tap, so every customer can use it." },
  { id: "setup", title: "How to set up the three links", body: "You give us your Google Review link, Instagram profile and WhatsApp number. We set them up on your card’s page so each one opens with a single tap." },
  { id: "stories", title: "Customer testimonials", body: "Customer stories will appear here once real testimonials are shared with us." },
  { id: "dispatch", title: "Product dispatch updates", body: "Dispatch photos and shipping updates will appear here. After you order, we also share updates on WhatsApp." },
];

export default function Store({ settings }: { settings: Settings }) {
  const { tiers, delivery_charge: delivery, upi_id: upi, whatsapp_number: wa, instagram_url: ig } = settings;

  const [qty, setQty] = useState(10);
  const [cart, setCart] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState<{ orderNo: number; total: number; url: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const c = Number(localStorage.getItem("ts_cart"));
      if (c > 0) {
        setCart(c);
        setQty(c);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      cart ? localStorage.setItem("ts_cart", String(cart)) : localStorage.removeItem("ts_cart");
    } catch {}
  }, [cart]);

  const unit = priceFor(qty, tiers);
  const cartUnit = cart ? priceFor(cart, tiers) : null;
  const subtotal = cartUnit !== null && cart ? cartUnit * cart : null;
  const total = subtotal !== null && delivery !== null ? subtotal + delivery : null;

  const waBase = `https://wa.me/${wa}`;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const setQtySafe = (n: number) =>
    setQty(Math.min(100000, Math.max(1, Math.floor(n) || 1)));

  const bulk = useMemo(() => tiers.map((t) => t.max).sort((a, b) => b - a)[0], [tiers]);

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(upi);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart) return;

    setBusy(true);
    setServerError("");
    setErrors({});

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: cart }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || {});
        setServerError(data.error || "Something went wrong.");
        return;
      }

      setDone({ orderNo: data.orderNo, total: data.total, url: data.whatsappUrl });
      setCart(null);
      setForm(EMPTY);
      window.open(data.whatsappUrl, "_blank", "noopener");
    } catch {
      setServerError("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) =>
    errors[k] && <p className="mt-1 text-sm text-[#f3a79e]" role="alert">{errors[k]}</p>;

  const inp = (k: keyof Form) => ({
    value: form[k],
    onChange: set(k),
    "aria-invalid": !!errors[k],
    className: "field",
  });

  return (
    <main>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-navy-700/60 bg-navy-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#top" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-navy-950">T</span>
            TapSmart
          </a>
          <nav className="hidden gap-6 text-sm text-ivory/80 md:flex">
            <a href="#learn" className="hover:text-gold-300">Learn</a>
            <a href="#how" className="hover:text-gold-300">How it works</a>
            <a href="#pricing" className="hover:text-gold-300">Pricing</a>
            <a href="#cart" className="hover:text-gold-300">Cart{cart ? ` (${cart})` : ""}</a>
          </nav>
          <a href="#pricing" className="rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-300">
            Order now
          </a>
        </div>
      </header>

      {/* A. Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_20%,#1A3066_0%,transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-6xl">Make Every Tap Count.</h1>
            <p className="mt-3 text-xl text-gold-300">One Tap. Three Ways to Connect.</p>
            <p className="mt-5 max-w-lg text-lg text-ivory/80">
              One TapSmart NFC card puts your Google Reviews, Instagram and WhatsApp in your customer’s hand. They tap the card or scan its QR code and pick where to go.
            </p>
            <p className="mt-3 font-semibold">Google Reviews. Instagram. WhatsApp. All in One Tap.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={waBase} target="_blank" rel="noopener noreferrer" className="rounded-full bg-gold-400 px-6 py-3 font-semibold text-navy-950 hover:bg-gold-300">WhatsApp us</a>
              <a href={`tel:+${wa}`} className="rounded-full border border-gold-400 px-6 py-3 font-semibold text-gold-300 hover:bg-navy-800">Call us</a>
              <a href={ig} target="_blank" rel="noopener noreferrer" className="rounded-full border border-navy-700 px-6 py-3 font-semibold hover:bg-navy-800">Instagram</a>
            </div>
          </div>

          {/* Product visual placeholder */}
          <div className="relative mx-auto w-full max-w-md" aria-label="TapSmart NFC review card (product image placeholder)">
            <div className="tapring absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-400/50" />
            <div className="relative rotate-[-6deg] rounded-[28px] border border-gold-400/40 bg-gradient-to-br from-navy-800 to-navy-900 p-7 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-bold">TapSmart</span>
                <span className="text-xs text-gold-300">NFC · QR</span>
              </div>
              <div className="mt-8 space-y-3">
                {["Google Reviews", "Instagram", "WhatsApp"].map((n) => (
                  <div key={n} className="flex items-center justify-between rounded-2xl border border-navy-700 bg-navy-950/60 px-4 py-3">
                    <span className="font-medium">{n}</span>
                    <span className="h-2 w-2 rounded-full bg-gold-400" />
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-ivory/60">Product image placeholder: replace with your card artwork.</p>
            </div>
          </div>
        </div>
      </section>

      {/* B. Learn */}
      <section id="learn" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-bold">Learn before you order</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEARN.map((c) => (
            <button key={c.id} onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}
              className="rounded-3xl border border-navy-700 bg-navy-900 p-6 text-left transition hover:border-gold-400/60">
              <span className="font-semibold">{c.title}</span>
              {open === c.id && (
                <span className="mt-3 block text-ivory/75">
                  <span className="mb-3 grid h-28 place-items-center rounded-2xl border border-dashed border-navy-700 text-sm text-ivory/50">Video placeholder</span>
                  {c.body}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* C. How it works */}
      <section id="how" className="bg-navy-900/60">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {["Customer taps the NFC card or scans its QR code.", "A page opens with Google Reviews, Instagram and WhatsApp.", "Customer picks the destination they need."].map((t, i) => (
              <li key={i} className="rounded-3xl border border-navy-700 bg-navy-950/60 p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-400 font-bold text-navy-950">{i + 1}</span>
                <p className="mt-4 text-lg">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* D. Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl font-bold">Choose your quantity</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-navy-700 bg-navy-900 p-6">
            <h3 className="font-semibold">Price per card</h3>
            <table className="mt-4 w-full text-left">
              <tbody>
                {[...tiers].sort((a, b) => a.min - b.min).map((t) => (
                  <tr key={t.min} className="border-t border-navy-700">
                    <td className="py-3">{tierLabel(t)} cards</td>
                    <td className="py-3 text-right font-semibold text-gold-300">{inr(t.price)}</td>
                  </tr>
                ))}
                <tr className="border-t border-navy-700">
                  <td className="py-3">Other quantities</td>
                  <td className="py-3 text-right text-ivory/70">Contact for Bulk Pricing</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-3xl border border-gold-400/40 bg-navy-900 p-6">
            <h3 className="font-semibold">TapSmart NFC Review Card</h3>
            <div className="mt-5 flex items-center gap-3">
              <button aria-label="Decrease quantity" onClick={() => setQtySafe(qty - 1)} className="h-12 w-12 rounded-full border border-gold-400 text-2xl text-gold-300 hover:bg-navy-800">−</button>
              <input aria-label="Quantity" inputMode="numeric" value={qty} onChange={(e) => setQtySafe(Number(e.target.value.replace(/\D/g, "")))} className="field w-24 text-center text-xl" />
              <button aria-label="Increase quantity" onClick={() => setQtySafe(qty + 1)} className="h-12 w-12 rounded-full border border-gold-400 text-2xl text-gold-300 hover:bg-navy-800">+</button>
            </div>

            {unit !== null ? (
              <div className="mt-6 space-y-1">
                <p className="text-ivory/70">{inr(unit)} per card</p>
                <p className="font-display text-4xl font-bold text-gold-300">{inr(unit * qty)}</p>
                <p className="text-sm text-ivory/60">Subtotal. Delivery is added in your cart.</p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-navy-700 p-4">
                <p className="font-semibold">Contact for Bulk Pricing</p>
                <p className="mt-1 text-sm text-ivory/70">{qty} cards need a custom quote.</p>
                <a href={`${waBase}?text=${encodeURIComponent(`Hi TapSmart, I need bulk pricing for ${qty} NFC review cards.`)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-gold-400 px-5 py-2 font-semibold text-navy-950">Ask on WhatsApp</a>
              </div>
            )}

            <button disabled={unit === null} onClick={() => { setCart(qty); setDone(null); document.getElementById("cart")?.scrollIntoView({ behavior: "smooth" }); }}
              className="mt-6 w-full rounded-full bg-gold-400 py-4 text-lg font-bold text-navy-950 hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-40">Add to Cart</button>
          </div>
        </div>
      </section>

      {/* E. Cart */}
      <section id="cart" className="bg-navy-900/60">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="font-display text-3xl font-bold">Your cart</h2>

          {done ? (
            <div className="mt-6 rounded-3xl border border-gold-400/50 bg-navy-900 p-6">
              <p className="text-xl font-semibold">Order #{done.orderNo} saved. Payment is pending verification.</p>
              <p className="mt-2 text-ivory/75">WhatsApp should have opened with your order message. Press Send there to finish. We confirm your order after we verify your payment.</p>
              <a href={done.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-full bg-gold-400 px-6 py-3 font-semibold text-navy-950">Open WhatsApp again</a>
            </div>
          ) : !cart || cartUnit === null ? (
            <p className="mt-6 text-ivory/70">Your cart is empty. Choose a quantity above and press Add to Cart.</p>
          ) : (
            <div className="mt-6 rounded-3xl border border-navy-700 bg-navy-950/60 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">TapSmart NFC Review Card</p>
                  <p className="text-ivory/70">{inr(cartUnit)} per card</p>
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label="Decrease" onClick={() => setCart(Math.max(1, cart - 1))} className="h-10 w-10 rounded-full border border-gold-400 text-gold-300">−</button>
                  <span className="w-12 text-center text-lg">{cart}</span>
                  <button aria-label="Increase" onClick={() => setCart(cart + 1)} className="h-10 w-10 rounded-full border border-gold-400 text-gold-300">+</button>
                  <button onClick={() => setCart(null)} className="ml-3 text-sm text-[#f3a79e] underline">Remove</button>
                </div>
              </div>

              <dl className="mt-6 space-y-2 border-t border-navy-700 pt-4">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{subtotal !== null ? inr(subtotal) : "Contact for Bulk Pricing"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd>{delivery === null ? "Not set yet" : inr(delivery)}</dd>
                </div>
                <div className="flex justify-between text-xl font-bold text-gold-300">
                  <dt>Total</dt>
                  <dd>{total !== null ? inr(total) : "Shown once delivery is set"}</dd>
                </div>
              </dl>

              {delivery === null && (
                <p className="mt-3 text-sm text-ivory/70">
                  Our delivery charge isn’t published yet. Message us on WhatsApp to confirm the delivery charge and final amount.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* F + G + H. Checkout */}
      {cart && cartUnit !== null && !done && (
        <section id="checkout" className="mx-auto max-w-6xl px-5 py-16">
          <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold">Delivery details</h2>
              <div className="mt-6 space-y-4">
                <div><label htmlFor="name">Full name</label><input id="name" autoComplete="name" {...inp("name")} />{err("name")}</div>
                <div><label htmlFor="phone">Mobile / WhatsApp number</label><input id="phone" inputMode="numeric" maxLength={10} autoComplete="tel-national" placeholder="10 digits" {...inp("phone")} />{err("phone")}</div>
                <div><label htmlFor="address">Full delivery address</label><textarea id="address" rows={3} autoComplete="street-address" {...inp("address")} />{err("address")}</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="city">City</label><input id="city" autoComplete="address-level2" {...inp("city")} />{err("city")}</div>
                  <div><label htmlFor="state">State</label><input id="state" autoComplete="address-level1" {...inp("state")} />{err("state")}</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="pin">PIN code</label><input id="pin" inputMode="numeric" maxLength={6} autoComplete="postal-code" {...inp("pin")} />{err("pin")}</div>
                  <div><label htmlFor="instagram">Instagram handle (optional)</label><input id="instagram" placeholder="@yourbusiness" {...inp("instagram")} />{err("instagram")}</div>
                </div>
                <div><label htmlFor="notes">Additional notes (optional)</label><textarea id="notes" rows={2} {...inp("notes")} />{err("notes")}</div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold">Scan &amp; Pay</h2>
              <div className="mt-6 rounded-3xl border border-gold-400/40 bg-navy-900 p-6">
                <p className="text-ivory/70">Product subtotal (delivery extra)</p>

                {/* FIX: Show product subtotal even when delivery charge is not configured */}
                <p className="font-display text-4xl font-bold text-gold-300">
                  {subtotal !== null ? inr(subtotal) : "Contact for Bulk Pricing"}
                </p>

                <p className="mt-2 text-sm text-ivory/70">
                  This is the product subtotal only. Delivery charge will be added separately. Please confirm the final payable amount with us before making payment.
                </p>

                {PAYMENT_QR ? (
                  <div className="mx-auto mt-5 w-56 overflow-hidden rounded-2xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={PAYMENT_QR} alt="TapSmart UPI payment QR code" className="h-auto w-full" />
                  </div>
                ) : (
                  <div className="mx-auto mt-5 grid h-56 w-56 place-items-center rounded-2xl border-2 border-dashed border-gold-400/60 p-4 text-center text-sm text-ivory/70">
                    Payment QR placeholder. Your UPI payment QR will appear here once it is added.
                  </div>
                )}

                <p className="mt-2 text-center text-sm text-ivory/60">
                  Please confirm the delivery charge and final payable amount with us before paying.
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <div className="field flex-1 truncate">{upi || "UPI ID not set yet (add it in Admin → Settings)"}</div>
                  <button type="button" onClick={copyUpi} disabled={!upi} className="rounded-full border border-gold-400 px-4 py-3 text-gold-300 disabled:opacity-40">
                    {copied ? "Copied" : "Copy UPI ID"}
                  </button>
                </div>

                <div className="mt-5">
                  <label htmlFor="utr">UTR / transaction reference</label>
                  <input id="utr" autoComplete="off" placeholder="From your UPI app after paying" {...inp("utr")} />
                  {err("utr")}
                </div>

                <p className="mt-3 text-sm text-ivory/70">
                  Your payment stays pending until we verify it manually.
                </p>
              </div>

              {serverError && (
                <p className="mt-4 rounded-2xl border border-[#f08a7e]/50 p-3 text-[#f3a79e]" role="alert">
                  {serverError}
                </p>
              )}

              <button type="submit" disabled={busy || total === null || !upi}
                className="mt-6 w-full rounded-full bg-gold-400 py-4 text-lg font-bold text-navy-950 hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-40">
                {busy ? "Saving your order…" : "Place order on WhatsApp"}
              </button>

              {(total === null || !upi) && (
                <p className="mt-2 text-sm text-ivory/70">
                  Online ordering will open once delivery charge and UPI ID are configured. Meanwhile, message us on WhatsApp to confirm your order and delivery charge.
                </p>
              )}

              <p className="mt-3 text-sm text-ivory/60">
                We save your order first, then open WhatsApp with the message ready. You press Send.
              </p>
            </div>
          </form>
        </section>
      )}

      <footer className="border-t border-navy-700 px-5 py-10 text-center text-ivory/70">
        <p className="font-display text-xl text-ivory">TapSmart</p>
        <p className="mt-1">Google Reviews. Instagram. WhatsApp. All in One Tap.</p>
        <div className="mt-4 flex justify-center gap-4">
          <a className="underline" href={waBase} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a className="underline" href={ig} target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </footer>
    </main>
  );
}
