import { dinero, toDecimal } from "dinero.js";
import { KES, USD } from "dinero.js/currencies";
import { prisma } from "@/lib/prisma";

/** Supported display currencies */
export type DisplayCurrency = "KES" | "USD";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cachedRate: number | null = null;
let cachedAt = 0;
let cachedFallback = 0.0077;

async function getCurrencySettings() {
  try {
    const s = await prisma.currencySettings.findUnique({
      where: { id: "default" },
    });
    return s;
  } catch {
    return null;
  }
}

/** Base currency for all stored prices (DB, products, orders) */
export async function getBaseCurrency(): Promise<string> {
  const s = await getCurrencySettings();
  return s?.baseCurrency ?? process.env.BASE_CURRENCY ?? "KES";
}

/**
 * Fetch KES → USD exchange rate.
 * Reads from DB (admin settings) first, then env.
 */
export async function getExchangeRate(): Promise<number> {
  if (cachedRate != null && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedRate;
  }

  const s = await getCurrencySettings();
  const baseUrl = s?.exchangeRateApiUrl ?? process.env.EXCHANGE_RATE_API_URL;
  const apiKey = s?.exchangeRateApiKey ?? process.env.EXCHANGE_RATE_API_KEY;
  const base = s?.baseCurrency ?? process.env.BASE_CURRENCY ?? "KES";
  const fallbackRate = s?.exchangeRateFallback ?? parseFloat(process.env.EXCHANGE_RATE_FALLBACK || "0.0077");
  cachedFallback = fallbackRate;

  if (baseUrl) {
    try {
      const url = new URL(baseUrl.endsWith(base) ? baseUrl : `${baseUrl.replace(/\/$/, "")}/${base}`);
      if (apiKey) url.searchParams.set("apikey", apiKey);
      const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
      const data = await res.json();
      const rate = data?.rates?.USD;
      if (typeof rate === "number" && rate > 0) {
        cachedRate = rate;
        cachedAt = Date.now();
        return rate;
      }
    } catch (e) {
      console.warn("Exchange rate fetch failed, using fallback:", e);
    }
  }

  cachedRate = fallbackRate;
  cachedAt = Date.now();
  return fallbackRate;
}

/**
 * Format amount for display.
 * @param amount Major units (e.g. 100.50)
 * @param currency Display currency
 * @param rate KES→USD rate (required when currency is USD)
 */
export function formatPrice(
  amount: number,
  currency: DisplayCurrency,
  rate?: number
): string {
  const amountMinor = Math.round(amount * 100);
  if (currency === "KES") {
    const d = dinero({ amount: amountMinor, currency: KES });
    return toDecimal(d, ({ value }) => `KES ${value}`);
  }
  const r = rate ?? cachedFallback ?? 0.0077;
  const usdAmount = amount * r;
  const usdMinor = Math.round(usdAmount * 100);
  const d = dinero({ amount: usdMinor, currency: USD });
  return toDecimal(d, ({ value }) => `$${value}`);
}
