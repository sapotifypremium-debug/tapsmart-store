
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ts_admin";
const TTL = 60 * 60 * 8; // 8 hours

const secret = () => process.env.ADMIN_SESSION_SECRET || "";

const sign = (v: string) =>
  crypto.createHmac("sha256", secret()).update(v).digest("hex");

const sha = (v: string) =>
  crypto.createHash("sha256").update(v).digest();

export function passwordOk(input: string) {
  const real = process.env.ADMIN_PASSWORD;

  if (!real || secret().length < 16) return false;

  return crypto.timingSafeEqual(sha(input), sha(real));
}

export async function setSession() {
  const exp = String(Math.floor(Date.now() / 1000) + TTL);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TTL,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE)?.value;

  if (!raw || secret().length < 16) return false;

  const [exp, sig] = raw.split(".");

  if (!exp || !sig) return false;

  const good = sign(exp);

  if (
    sig.length !== good.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))
  ) {
    return false;
  }

  return Number(exp) > Date.now() / 1000;
}
