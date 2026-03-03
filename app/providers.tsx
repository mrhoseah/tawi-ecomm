"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/Toast";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5} refetchOnWindowFocus={true}>
      <CurrencyProvider>
        <ToastProvider>{children}</ToastProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}

