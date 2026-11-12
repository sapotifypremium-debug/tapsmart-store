import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { priceFor, inr } from "@/lib/pricing";
import { validateOrder } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const r = validateOrder(body);
  if (!r.ok) return NextResponse.json({ error: "Please fix the highlighted fields.", errors: r.errors }, { status: 400 });
  const v = r.v;

  const client = db();
  if (!client) return NextResponse.json({ error: "Ordering is not set up yet (database not configured)." }, { status: 503 });

  const settings = await getSettings();
  const unit = priceFor(v.quantity, settings.tiers);
  if (unit === null) return NextResponse.json({ error: "This quantity needs a bulk quote. Please contact us on WhatsApp." }, { status: 400 });
  if (settings.delivery_charge === null) return NextResponse.json({ error: "Delivery charge is not configured yet. Please contact us on WhatsApp." }, { status: 503 });
  if (!settings.upi_id) return NextResponse.json({ error: "Payment details are not configured yet. Please contact us on WhatsApp." }, { status: 503 });

  const subtotal = unit * v.quantity;
  const delivery = settings.delivery_charge;
  const total = subtotal + delivery;
  const handle = v.instagram ? "@" + v.instagram.replace(/^@/, "") : null;

  // 1. Save first
  const { data, error } = await client.from("orders").insert({
    name: v.name, phone: v.phone, address: v.address, city: v.city, state: v.state, pin: v.pin,
    instagram: handle, notes: v.notes || null, quantity: v.quantity, unit_price: unit,
    subtotal, delivery_charge: delivery, total, utr: v.utr,
  }).select("id, order_no").single();
  if (error || !data) return NextResponse.json({ error: "Could not save your order. Please try again." }, { status: 500 });

  // 2. Build prefilled WhatsApp message (customer presses Send themselves)
  const msg = [
    `New TapSmart order #${data.order_no}`,
    `Name: ${v.name}`,
    `Phone: ${v.phone}`,
    `Quantity: ${v.quantity} NFC Review Card(s)`,
    `Price per card: ${inr(unit)}`,
    `Subtotal: ${inr(subtotal)}`,
    `Delivery: ${inr(delivery)}`,
    `Total: ${inr(total)}`,
    `Address: ${v.address}, ${v.city}, ${v.state} - ${v.pin}`,
    `UTR / reference: ${v.utr}`,
    handle ? `Instagram: ${handle}` : null,
    v.notes ? `Notes: ${v.notes}` : null,
    `Payment status: Pending verification`,
  ].filter(Boolean).join("\n");
  const whatsappUrl = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`;

  return NextResponse.json({ orderNo: data.order_no, total, whatsappUrl });
}
