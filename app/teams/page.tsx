import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Teams",
  description: "Browse teams and support them with official merchandise.",
};
import Footer from "@/components/Footer";
import TeamsClient from "./TeamsClient";

export default function TeamsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Teams</h1>
            <p className="text-red-100 text-lg max-w-2xl">
              Browse teams and support them with official merchandise.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <TeamsClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
