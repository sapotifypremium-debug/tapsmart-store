import Store from "@/components/Store";
import { getSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
export default async function Page() {
  const s = await getSettings();
  return <Store settings={s} />;
}
