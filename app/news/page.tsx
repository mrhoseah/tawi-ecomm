import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { Newspaper, Zap, Trophy } from "lucide-react";
import { NewsContent } from "./NewsContent";

export const metadata: Metadata = {
  title: "Sports News | Match Reports & Team Updates",
  description:
    "Latest sports news, match reports, and stories from your favorite teams. Stay up to date with the biggest moments.",
};

async function getNews() {
  try {
    return await prisma.news.findMany({
      orderBy: { publishedAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export default async function NewsPage() {
  const news = await getNews();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        {/* Hero - professional sporty style */}
        <div className="relative bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/60" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          <div className="relative mx-auto max-w-7xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600/90 rounded-full text-sm font-semibold uppercase tracking-wider">
                <Zap className="h-4 w-4" />
                Breaking News
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-red-100 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                Sports Hub
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-600 rounded-xl">
                <Newspaper className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  Sports News
                </h1>
                <p className="text-red-100/90 text-lg sm:text-xl mt-2 max-w-2xl">
                  Match reports, team updates, and the biggest stories from the world of sports.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <NewsContent news={news} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
