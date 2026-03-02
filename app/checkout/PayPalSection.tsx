"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/components/Toast";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

type PayPalLib = typeof import("@paypal/react-paypal-js");

type PayPalSectionProps = {
  paypalOrderId: string;
  pendingOrderNumber: string;
  total: number;
  setIsProcessing: (value: boolean) => void;
};

export default function PayPalSection({
  paypalOrderId,
  pendingOrderNumber,
  total,
  setIsProcessing,
}: PayPalSectionProps) {
  const router = useRouter();
  const { clearCart } = useCartStore();
  const { showToast } = useToast();
  const [paypalLib, setPaypalLib] = useState<PayPalLib | null>(null);

  useEffect(() => {
    let mounted = true;
    import("@paypal/react-paypal-js")
      .then((mod) => {
        if (mounted) setPaypalLib(mod);
      })
      .catch((err) => {
        console.error("Failed to load PayPal SDK", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!PAYPAL_CLIENT_ID || !paypalLib) return null;

  const { PayPalScriptProvider, PayPalButtons } = paypalLib;

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
      <PayPalButtons
        createOrder={() => Promise.resolve(paypalOrderId)}
        onApprove={async () => {
          setIsProcessing(true);
          try {
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderNumber: pendingOrderNumber,
                paypalOrderId,
              }),
            });
            if (!res.ok) throw new Error("Capture failed");
            clearCart();
            router.push(`/order/${pendingOrderNumber}`);
            router.refresh();
          } catch (err) {
            showToast(
              err instanceof Error ? err.message : "Payment failed",
              "error"
            );
          } finally {
            setIsProcessing(false);
          }
        }}
        onError={(err) =>
          showToast(
            err && typeof err === "object" && "message" in err
              ? String((err as any).message)
              : "PayPal error",
            "error"
          )
        }
      />
    </PayPalScriptProvider>
  );
}


