
import { DEFAULT_TIERS, Tier } from "./pricing";
import { db } from "./supabase";

export type Settings = {
  tiers: Tier[];
  delivery_charge: number | null;
  upi_id: string;
  whatsapp_number: string;
  instagram_url: string;
};

export const DEFAULT_SETTINGS: Settings = {
  tiers: DEFAULT_TIERS,
  delivery_charge: null,
  upi_id: "shubham314@fam",
  whatsapp_number: "917977730026",
  instagram_url: "https://www.instagram.com/tapsmart.official/",
};

export async function getSettings(): Promise<Settings> {
  const client = db();

  if (!client) return DEFAULT_SETTINGS;

  const { data } = await client
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return DEFAULT_SETTINGS;

  return {
    tiers: (data.tiers as Tier[]) ?? DEFAULT_TIERS,
    delivery_charge: data.delivery_charge ?? null,
    upi_id: data.upi_id ?? DEFAULT_SETTINGS.upi_id,
    whatsapp_number:
      data.whatsapp_number ?? DEFAULT_SETTINGS.whatsapp_number,
    instagram_url:
      data.instagram_url ?? DEFAULT_SETTINGS.instagram_url,
  };
}
