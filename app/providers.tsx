"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/Toast";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={true}
      refetchInterval={5}
      refetchWhenOffline={false}
      refetchOnMount="always"
      staleTime={0}
    >
      <CurrencyProvider>
        <ToastProvider>{children}</ToastProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}

