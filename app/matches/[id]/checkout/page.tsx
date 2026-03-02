"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Smartphone, Building2 } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function MatchCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const matchId = params.id as string;
  const [match, setMatch] = useState<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    venue: string | null;
    accessPrice: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "mpesa">("bank");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName?: string;
    instructions?: string;
  } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/sign-in?callbackUrl=/matches/${matchId}/checkout`);
      return;
    }
    fetch(`/api/matches`)
      .then((res) => res.json())
      .then((matches: any[]) => {
        const m = matches.find((x: any) => x.id === matchId);
        if (m) setMatch(m);
      })
      .catch(() => {});
    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.bankName || data.accountNumber) {
          setBankDetails({
            bankName: data.bankName || "",
            accountName: data.accountName || "",
            accountNumber: data.accountNumber || "",
            branchName: data.branchName,
            instructions: data.instructions,
          });
        }
      })
      .catch(() => {});
  }, [matchId, status, router]);

  const handleConfirmPayment = async () => {
    if (!match) return;
    if (paymentMethod === "bank" && (!bankDetails?.accountNumber || !bankDetails?.bankName)) {
      showToast("Bank details not configured. Contact support.", "error");
      return;
    }
    if (paymentMethod === "mpesa" && !mpesaPhone.trim()) {
      showToast("Enter your M-Pesa phone number", "error");
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === "mpesa") {
        const stkRes = await fetch("/api/mpesa/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: mpesaPhone.trim(),
            amount: match.accessPrice,
            orderNumber: `MATCH-${matchId.slice(0, 8)}`,
          }),
        });
        const stkData = await stkRes.json();
        if (!stkRes.ok) {
          showToast(stkData.error || "M-Pesa request failed", "error");
          setLoading(false);
          return;
        }
        showToast("Check your phone to complete payment. Access will be granted when payment is confirmed.", "success");
      }

      // Create MatchAccess record (user confirms payment)
      const res = await fetch("/api/match-access/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.alreadyOwned || data.success) {
        showToast("Access granted! You can now watch this match.", "success");
        router.push(`/matches/${matchId}`);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !match) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Link href={`/matches/${matchId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <h1 className="text-2xl font-bold mb-6">Pay for Match Access</h1>
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {match.homeTeam} vs {match.awayTeam}
            </p>
            <p className="text-gray-600 text-sm mb-4">
              {new Date(match.matchDate).toLocaleString()} {match.venue && `• ${match.venue}`}
            </p>
            <p className="text-2xl font-bold text-red-600">${match.accessPrice.toFixed(2)}</p>
          </div>

          <div className="space-y-4 mb-8">
            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="pay"
                value="bank"
                checked={paymentMethod === "bank"}
                onChange={() => setPaymentMethod("bank")}
              />
              <Building2 className="h-5 w-5" />
              Bank Transfer
            </label>
            {paymentMethod === "bank" && bankDetails && (
              <div className="ml-7 p-4 bg-white border rounded-lg text-sm space-y-2">
                <p><strong>Bank:</strong> {bankDetails.bankName}</p>
                <p><strong>Account:</strong> {bankDetails.accountName} - {bankDetails.accountNumber}</p>
                {bankDetails.branchName && <p><strong>Branch:</strong> {bankDetails.branchName}</p>}
                {bankDetails.instructions && (
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">{bankDetails.instructions}</p>
                )}
              </div>
            )}

            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="pay"
                value="mpesa"
                checked={paymentMethod === "mpesa"}
                onChange={() => setPaymentMethod("mpesa")}
              />
              <Smartphone className="h-5 w-5" />
              M-Pesa
            </label>
            {paymentMethod === "mpesa" && (
              <div className="ml-7">
                <input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
