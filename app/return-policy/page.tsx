import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Return Policy & Refunds",
  description: "Return policy and refund information for Tawi Shop. Learn how to request returns and get refunds.",
};

async function getPageContent() {
  try {
    return await prisma.page.findUnique({
      where: { slug: "return-policy" },
    });
  } catch {
    return null;
  }
}

export default async function ReturnPolicyPage() {
  const page = await getPageContent();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {page ? (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                {page.title}
              </h1>
              <div
                className="prose prose-gray max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
              <p className="mt-8 text-gray-600">
                <Link href="/returns" className="text-red-600 hover:text-red-700 font-medium">
                  Request a return →
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Return Policy & Refunds
              </h1>
              <p className="text-gray-600 mb-8">
                This page is not available yet. Please check back later.
              </p>
              <Link
                href="/"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Return to home
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
