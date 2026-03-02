import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import SectionHeader from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Home",
  description: "Official Tawi Shop - Premium sports jerseys, kits, and athletic apparel. Owned by Tawi TV.",
};
import Footer from "@/components/Footer";
import PromoBar from "@/components/PromoBar";
import HeroSection from "@/components/HeroSection";
import CategoryCards from "@/components/CategoryCards";
import ProductSection from "@/components/ProductSection";
import ProductCarousel from "@/components/ProductCarousel";
import { ArrowRight, Star, Shield, Truck, Headphones, Newspaper, Trophy, Calendar, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getLatestNews() {
  try {
    return await prisma.news.findMany({
      orderBy: { publishedAt: "desc" },
      take: 3,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

async function getUpcomingMatches() {
  try {
    return await prisma.match.findMany({
      where: {
        matchDate: { gte: new Date() },
        status: { in: ["scheduled", "live"] },
      },
      orderBy: { matchDate: "asc" },
      take: 4,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

async function getCategories() {
  try {
    const cats = await prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return cats.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      imageUrl: c.imageUrl,
    }));
  } catch {
    return [];
  }
}

async function getHomeProducts() {
  try {
    const [featured, newArrivals, bestSellers, onSale] = await Promise.all([
      prisma.product.findMany({
        where: { featured: true, active: true },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { newArrival: true, active: true },
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { bestSeller: true, active: true },
        take: 4,
        orderBy: { reviewCount: "desc" },
      }),
      prisma.product.findMany({
        where: { OR: [{ onSale: true }, { compareAtPrice: { not: null } }], active: true },
        take: 4,
      }),
    ]);
    return { featured, newArrivals, bestSellers, onSale };
  } catch (error) {
    console.error("Error fetching home products:", error);
    return {
      featured: [],
      newArrivals: [],
      bestSellers: [],
      onSale: [],
    };
  }
}

function formatNewsDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMatchDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Home() {
  const [homeProducts, news, upcomingMatches, categories] = await Promise.all([
    getHomeProducts(),
    getLatestNews(),
    getUpcomingMatches(),
    getCategories(),
  ]);
  const { featured, newArrivals, bestSellers, onSale } = homeProducts;

  return (
    <div className="min-h-screen flex flex-col">
      <PromoBar />
      <Header />

      <main className="flex-1">
        <HeroSection
          upcomingMatches={upcomingMatches.map((m) => ({
            id: m.id,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            matchDate: m.matchDate.toISOString(),
            venue: m.venue,
            accessPrice: m.accessPrice,
          }))}
        />

        {/* Shop by Category - immediate browsing */}
        <CategoryCards categories={categories} />

        {/* Featured Products - core offering */}
        <ProductSection
          products={featured}
          title="Featured Products"
          subtitle="Our most popular items"
          viewAllHref="/shop"
          viewAllLabel="View All Products"
          columns={4}
          bg="gray"
        />

        {/* Best Sellers Carousel - social proof */}
        {(bestSellers.length > 0 || featured.length > 0) && (
          <section className="py-20 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Best Sellers
                </h2>
                <p className="text-gray-600">
                  Trending now—see what other fans are buying
                </p>
              </div>
              <ProductCarousel
                products={bestSellers.length > 0 ? bestSellers : featured.slice(0, 6)}
                title=""
                subtitle=""
              />
            </div>
          </section>
        )}

        {/* Upcoming Games - streaming / matches */}
        <section id="matches" className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Upcoming Games"
              description="Don't miss the action—get match access"
              icon={Trophy}
              viewAllHref="/matches"
              viewAllLabel="View All Matches"
            />
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-600">No upcoming matches. Check back soon.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-red-100 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <span className="text-lg font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">{match.homeTeam}</span>
                      <span className="text-sm text-gray-400 font-medium px-2">vs</span>
                      <span className="text-lg font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">{match.awayTeam}</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {formatMatchDate(match.matchDate)}
                      </span>
                      {match.venue && (
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {match.venue}
                        </span>
                      )}
                    </div>
                    {match.accessPrice > 0 && (
                      <p className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold text-sm">
                        Get Access — ${match.accessPrice.toFixed(2)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* New Arrivals */}
        <ProductSection
          products={newArrivals}
          title="New Arrivals"
          subtitle="Fresh drops just in"
          viewAllHref="/shop"
          viewAllLabel="See New"
          columns={4}
          bg="white"
        />

        {/* On Sale */}
        <ProductSection
          products={onSale}
          title="On Sale"
          subtitle="Limited-time deals"
          viewAllHref="/shop?onSale=true"
          viewAllLabel="Shop Sale"
          columns={4}
          bg="gray"
        />

        {/* Latest News - editorial, lower in flow */}
        <section id="news" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Latest News"
              description="Stay updated with the latest sports news"
              icon={Newspaper}
              viewAllHref="/news"
              viewAllLabel="View All"
            />
            {news.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-600">No news yet. Check back soon.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {news.map((item) => (
                  <Link
                    key={item.id}
                    href="/news"
                    className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-red-100 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.teams.map((team) => (
                        <span
                          key={team}
                          className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700"
                        >
                          {team}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">{item.title}</h3>
                    {item.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.excerpt}</p>
                    )}
                    <p className="text-sm text-gray-500">{formatNewsDate(item.publishedAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-xl mb-4">
                  <Truck className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
                <p className="text-gray-600 text-sm">
                  Free shipping on orders over $50
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-xl mb-4">
                  <Shield className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Authentic Products</h3>
                <p className="text-gray-600 text-sm">
                  100% authentic jerseys guaranteed
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-xl mb-4">
                  <Headphones className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
                <p className="text-gray-600 text-sm">
                  Customer support whenever you need
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-xl mb-4">
                  <Star className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Name & Number Printing</h3>
                <p className="text-gray-600 text-sm">
                  Personalize jerseys with your name and number
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 bg-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">
              Ready to rep your team?
            </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Your destination for authentic jerseys, training wear, and match-day gear.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-10 py-4 bg-red-600 text-white rounded-full font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30"
            >
              Start Shopping
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
