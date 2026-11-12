"use client";
import { useState } from "react";
export default function Login() {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.href = "/admin"; else { setErr((await r.json()).error || "Login failed."); setBusy(false); }
  }
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form onSubmit={go} className="w-full max-w-sm rounded-3xl border border-navy-700 bg-navy-900 p-8">
        <h1 className="font-display text-2xl font-bold">TapSmart admin</h1>
        <label htmlFor="pw" className="mt-6">Password</label>
        <input id="pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="field" />
        {err && <p className="mt-2 text-sm text-[#f3a79e]" role="alert">{err}</p>}
        <button disabled={busy || !pw} className="mt-5 w-full rounded-full bg-gold-400 py-3 font-bold text-navy-950 disabled:opacity-40">Sign in</button>
      </form>
    </main>
  );
}
