"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";

function VerifyForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed || !code.trim()) {
      setError("Email and verification code are required");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/cognito/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }
      window.location.href = `/sign-up/success?email=${encodeURIComponent(emailTrimmed)}&flow=cognito`;
    } catch {
      setError("An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      setError("Enter your email first.");
      return;
    }
    setError("");
    setSuccess("");
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/cognito/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code");
        return;
      }
      setSuccess("A new verification code was sent. Check your email.");
    } catch {
      setError("An error occurred.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-2 text-center">Verify your email</h1>
            <p className="text-gray-600 text-center mb-6">
              Enter the verification code we sent to your email.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Verification code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  autoComplete="one-time-code"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                {isLoading ? "Verifying..." : "Verify email"}
              </button>
            </form>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-600">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend code"}
              </button>
              <span className="hidden sm:inline">·</span>
              <Link href="/sign-up" className="text-red-600 hover:text-red-700 font-medium">
                Sign up again
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><LoadingSpinner /></main><Footer /></div>}>
      <VerifyForm />
    </Suspense>
  );
}
