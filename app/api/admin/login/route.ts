import { NextResponse } from "next/server";
import { passwordOk, setSession } from "@/lib/auth";
export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !passwordOk(password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  setSession();
  return NextResponse.json({ ok: true });
}
