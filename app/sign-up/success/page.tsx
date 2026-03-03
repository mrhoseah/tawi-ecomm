"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, ShoppingBag, User, Mail, ArrowRight } from "lucide-react";

function SignUpSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const emailSent = searchParams.get("emailSent") === "true";
  const signedIn = searchParams.get("signedIn") === "true";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Account created successfully
            </h1>
            <p className="text-gray-600 mb-6">
              {signedIn
                ? "You're signed in and ready to go."
                : "Your account is ready. Sign in to get started."}
            </p>

            {emailSent && email && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6 p-3 bg-blue-50 rounded-lg">
                <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  We&apos;ve sent a welcome email to <strong>{email}</strong>. Check your inbox.
                </span>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <p className="text-sm font-medium text-gray-700">What&apos;s next?</p>
              <div className="grid gap-3 text-left">
                <Link
                  href="/shop"
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-600 hover:bg-red-50/50 transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-red-100">
                    <ShoppingBag className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Browse the shop</p>
                    <p className="text-sm text-gray-500">Jerseys, apparel, and more</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                </Link>
                <Link
                  href={signedIn ? "/account" : "/sign-in"}
                  className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-600 hover:bg-red-50/50 transition-colors group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-red-100">
                    <User className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {signedIn ? "View your account" : "Sign in to continue"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {signedIn ? "Manage profile, orders, addresses" : "Access your account"}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                </Link>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Continue to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
        </main>
        <Footer />
      </div>
    }>
      <SignUpSuccessContent />
    </Suspense>
  );
}
