"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { validatePasswordClient } from "@/lib/client-password-validation";
import { PasswordInput } from "@/components/ui/password-input";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      setError("Email is required");
      return;
    }
    if (!code.trim()) {
      setError("Reset code is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const pwdValidation = validatePasswordClient(newPassword);
    if (!pwdValidation.valid) {
      setError(pwdValidation.errors[0] || "Password does not meet requirements");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/cognito/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailTrimmed,
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Password reset successfully
              </h1>
              <p className="text-gray-600 mb-6">
                You can now sign in with your new password.
              </p>
              <Link
                href="/sign-in"
                className="inline-flex justify-center w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold mb-2 text-center">
              Reset password
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Enter the code from your email and your new password.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
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
                <label className="block text-sm font-medium mb-1">
                  Reset code
                </label>
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

              <div>
                <label className="block text-sm font-medium mb-1">
                  New password
                </label>
                <PasswordInput
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 pr-10"
                  placeholder="Min 8 chars, upper, lower, number, special"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must include uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm new password
                </label>
                <PasswordInput
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 h-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 pr-10"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                {isLoading ? "Resetting..." : "Reset password"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Need a new code?{" "}
              <Link
                href="/forgot-password"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Request again
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </main>
          <Footer />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
