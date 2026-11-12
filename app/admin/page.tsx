import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import AdminPanel from "@/components/AdminPanel";
export const dynamic = "force-dynamic";
export const metadata = { title: "TapSmart Admin", robots: { index: false, follow: false } };

export default async function Admin() {
  if (!isAdmin()) redirect("/admin/login");
  const client = db();
  const { data } = client ? await client.from("orders").select("*").order("created_at", { ascending: false }).limit(500) : { data: [] };
  return <AdminPanel orders={data ?? []} settings={await getSettings()} dbReady={!!client} />;
}
