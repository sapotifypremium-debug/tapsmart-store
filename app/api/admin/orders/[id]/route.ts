
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";

const STATUSES = [
  "Pending",
  "Payment Verified",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const client = db();

  if (!client) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const b = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (b.status !== undefined) {
    if (!STATUSES.includes(b.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    patch.status = b.status;

    if (b.status === "Payment Verified") {
      patch.payment_verified = true;
    }
  }

  if (b.payment_verified !== undefined) {
    patch.payment_verified = b.payment_verified === true;

    if (patch.payment_verified && !patch.status) {
      patch.status = "Payment Verified";
    }
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 }
    );
  }

  const { error } = await client
    .from("orders")
    .update(patch)
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
