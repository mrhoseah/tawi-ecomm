"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { DisplayCurrency } from "@/lib/currency";
import { formatPrice as formatPriceLib } from "@/lib/currency";

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  rate: number | null;
  formatPrice: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency: DisplayCurrency = "KES";
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/currency/rate")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.rate === "number") setRate(data.rate);
      })
      .catch(() => setRate(0.0077));
  }, []);

  const setCurrency = useCallback((_c: DisplayCurrency) => {
    // Sticking to KES only; no-op
  }, []);

  const formatPrice = useCallback(
    (amount: number) => formatPriceLib(amount, "KES", rate ?? undefined),
    [rate]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, rate, formatPrice }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx)
    throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
