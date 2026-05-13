import { supabase } from "@/integrations/supabase/client";

export type Tier =
  | "pro_max" | "pro" | "standard" | "mini_se"
  | "ipad_pro" | "ipad_std"
  | "macbook_new" | "macbook_intel"
  | "watch";

export const TIERS: { key: Tier; label: string }[] = [
  { key: "pro_max",      label: "iPhone Pro Max" },
  { key: "pro",          label: "iPhone Pro/Plus" },
  { key: "standard",     label: "iPhone standard" },
  { key: "mini_se",      label: "iPhone mini/SE" },
  { key: "ipad_pro",     label: "iPad Pro/Air" },
  { key: "ipad_std",     label: "iPad standard" },
  { key: "macbook_new",  label: "MacBook (M-chip)" },
  { key: "macbook_intel",label: "MacBook (Intel)" },
  { key: "watch",        label: "Apple Watch" },
];

export type IssuePrices = Record<string, Partial<Record<Tier, string>>>;

export const DEFAULT_PRICES: IssuePrices = {
  "Poškodovan zaslon": {
    pro_max: "169–189€", pro: "139–159€", standard: "109–129€", mini_se: "89–99€",
    ipad_pro: "179–229€", ipad_std: "119–149€",
    macbook_new: "299–399€", macbook_intel: "199–279€",
    watch: "99–149€",
  },
  "Ne polni / Baterija": {
    pro_max: "89€", pro: "79€", standard: "69€", mini_se: "59€",
    ipad_pro: "99€", ipad_std: "79€",
    macbook_new: "129€", macbook_intel: "99€",
    watch: "79€",
  },
  "Ne vključi se": {
    pro_max: "od 149€", pro: "od 149€", standard: "od 129€", mini_se: "od 99€",
    ipad_pro: "od 149€", ipad_std: "od 119€",
    macbook_new: "od 199€", macbook_intel: "od 149€",
    watch: "od 99€",
  },
  "Stik s tekočino": {
    pro_max: "99–149€", pro: "89–129€", standard: "79–109€", mini_se: "79€",
    ipad_pro: "119–149€", ipad_std: "99–119€",
    macbook_new: "129–199€", macbook_intel: "99–149€",
    watch: "99€",
  },
  "Počasen": {
    pro_max: "od 79€", pro: "od 79€", standard: "od 69€", mini_se: "od 59€",
    ipad_pro: "od 79€", ipad_std: "od 69€",
    macbook_new: "od 99€", macbook_intel: "od 79€",
    watch: "od 69€",
  },
  "Izguba podatkov": {
    pro_max: "od 119€", pro: "od 109€", standard: "od 99€", mini_se: "od 99€",
    ipad_pro: "od 119€", ipad_std: "od 99€",
    macbook_new: "od 149€", macbook_intel: "od 119€",
    watch: "od 99€",
  },
  "Tipkovnica ne deluje": {
    macbook_new: "149–249€", macbook_intel: "99–179€",
    pro_max: "od 99€", pro: "od 99€", standard: "od 79€", mini_se: "od 79€",
  },
  "Drugo": {
    pro_max: "Po diagnostiki", pro: "Po diagnostiki",
    standard: "Po diagnostiki", mini_se: "Po diagnostiki",
    ipad_pro: "Po diagnostiki", ipad_std: "Po diagnostiki",
    macbook_new: "Po diagnostiki", macbook_intel: "Po diagnostiki",
    watch: "Po diagnostiki",
  },
};

// Module-level cache so BookingForm and ChatBubble share one fetch.
let _cache: IssuePrices | null = null;
let _fetchPromise: Promise<IssuePrices> | null = null;

export async function fetchServicePrices(): Promise<IssuePrices> {
  if (_cache) return _cache;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("settings")
        .select("value")
        .eq("key", "service_prices")
        .single();
      const prices = (data?.value ?? null) as IssuePrices | null;
      _cache = prices ?? DEFAULT_PRICES;
    } catch {
      _cache = DEFAULT_PRICES;
    }
    _fetchPromise = null;
    return _cache!;
  })();

  return _fetchPromise;
}

export function invalidatePricesCache(): void {
  _cache = null;
}

export async function saveServicePrices(prices: IssuePrices): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("settings")
    .upsert({ key: "service_prices", value: prices as unknown }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  _cache = prices;
}

export function getPrice(prices: IssuePrices, model: string, issue: string, modelTier: Record<string, Tier>): string {
  const tier = modelTier[model];
  if (!tier) return "Po diagnostiki";
  return prices[issue]?.[tier] ?? "Po diagnostiki";
}
