
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = db();

  if (!client) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const b = await req.json().catch(() => null);

  if (!b) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const tiers = b.tiers;

  if (
    !Array.isArray(tiers) ||
    !tiers.length ||
    tiers.length > 12 ||
    !tiers.every(
      (t: any) =>
        Number.isInteger(t?.min) &&
        Number.isInteger(t?.max) &&
        Number.isInteger(t?.price) &&
        t.min >= 1 &&
        t.max >= t.min &&
        t.price > 0
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Each price band needs whole numbers: from, to (≥ from) and a price above 0.",
      },
      { status: 400 }
    );
  }

  const sorted = [...tiers].sort((a, c) => a.min - c.min);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min <= sorted[i - 1].max) {
      return NextResponse.json(
        { error: "Price bands must not overlap." },
        { status: 400 }
      );
    }
  }

  const delivery =
    b.delivery_charge === null || b.delivery_charge === ""
      ? null
      : Number(b.delivery_charge);

  if (
    delivery !== null &&
    (!Number.isInteger(delivery) || delivery < 0 || delivery > 100000)
  ) {
    return NextResponse.json(
      {
        error:
          "Delivery charge must be a whole number (0 for free delivery), or empty if not set.",
      },
      { status: 400 }
    );
  }

  const upi = String(b.upi_id ?? "").trim();

  if (upi && !/^[A-Za-z0-9._-]{2,}@[A-Za-z0-9]{2,}$/.test(upi)) {
    return NextResponse.json(
      { error: "UPI ID should look like name@bank." },
      { status: 400 }
    );
  }

  const wa = String(b.whatsapp_number ?? "").replace(/[^\d]/g, "");

  if (!/^\d{11,15}$/.test(wa)) {
    return NextResponse.json(
      {
        error:
          "WhatsApp number must include country code, e.g. 917977730026.",
      },
      { status: 400 }
    );
  }

  const ig = String(b.instagram_url ?? "").trim();

  if (
    !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._/-]+$/.test(ig)
  ) {
    return NextResponse.json(
      {
        error:
          "Instagram link must start with https://www.instagram.com/",
      },
      { status: 400 }
    );
  }

  const { error } = await client.from("settings").upsert({
    id: 1,
    tiers: sorted,
    delivery_charge: delivery,
    upi_id: upi,
    whatsapp_number: wa,
    instagram_url: ig,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not save settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
