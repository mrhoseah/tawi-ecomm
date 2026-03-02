import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import ProductCard from "@/components/ProductCard";
import MatchesSearchBar from "@/components/MatchesSearchBar";
import MatchesPagination from "@/components/MatchesPagination";
import { Trophy, Calendar, MapPin, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Matches",
  description: "Live and upcoming sports matches. Purchase access to watch live streams.",
};

const PER_PAGE = 6;

interface SearchParams {
  search?: string;
  status?: string;
  page?: string;
  sort?: string;
}

async function getMatches(searchParams: SearchParams) {
  const where: Prisma.MatchWhereInput = {};

  // Search by team name
  if (searchParams.search?.trim()) {
    const term = searchParams.search.trim().toLowerCase();
    where.OR = [
      { homeTeam: { contains: term, mode: "insensitive" } },
      { awayTeam: { contains: term, mode: "insensitive" } },
      { venue: { contains: term, mode: "insensitive" } },
    ];
  }

  // Filter by status
  if (searchParams.status && ["scheduled", "live", "finished"].includes(searchParams.status)) {
    where.status = searchParams.status;
  }

  const sortOrder = searchParams.sort === "date-desc" ? "desc" : "asc";

  try {
    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: { matchDate: sortOrder },
        skip: ((parseInt(searchParams.page || "1", 10) || 1) - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.match.count({ where }),
    ]);
    return { matches, total };
  } catch (error) {
    console.error("Error fetching matches:", error);
    return { matches: [], total: 0 };
  }
}

async function getProductsForTeams(teams: string[]) {
  try {
    return await prisma.product.findMany({
      where: {
        active: true,
        tags: { hasSome: teams },
      },
      take: 4,
    });
  } catch (error) {
    console.error("Error fetching products for teams:", error);
    return [];
  }
}

function formatMatchDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildClearParams(params: SearchParams, key: keyof SearchParams) {
  const sp = new URLSearchParams(params as Record<string, string>);
  sp.delete(key);
  sp.delete("page");
  const qs = sp.toString();
  return qs ? `/matches?${qs}` : "/matches";
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const { matches, total } = await getMatches(params);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 flex items-center gap-3">
              <Trophy className="h-10 w-10 text-red-200" />
              Matches
            </h1>
            <p className="text-red-100 text-lg max-w-2xl">
              Live matches, schedules, and results. Support your team with official merchandise.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Search & Filters */}
          <div className="mb-8">
            <MatchesSearchBar />

            {/* Active filter chips */}
            {(params.search || params.status) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {params.search && (
                  <Link
                    href={buildClearParams(params, "search")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-red-50 transition-colors"
                  >
                    <span>Search: {params.search}</span>
                    <X className="h-3 w-3" />
                  </Link>
                )}
                {params.status && (
                  <Link
                    href={buildClearParams(params, "status")}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-red-50 transition-colors"
                  >
                    <span className="capitalize">Status: {params.status}</span>
                    <X className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{total}</span> match{total !== 1 ? "es" : ""} found
            </p>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Trophy className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Try adjusting your search or filters. Check back soon for upcoming fixtures.
              </p>
              <Link
                href="/matches"
                className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                View all matches
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-12">
                {matches.map(async (match) => {
                  const teams = [match.homeTeam, match.awayTeam];
                  const products = await getProductsForTeams(teams);
                  return (
                    <section
                      key={match.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Link
                              href={`/matches/${match.id}`}
                              className="group text-center sm:text-left"
                            >
                              <span className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                                {match.homeTeam}
                              </span>
                              <span className="hidden sm:inline mx-3 text-gray-400 font-medium">vs</span>
                              <span className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors sm:inline">
                                {match.awayTeam}
                              </span>
                            </Link>
                            <span
                              className={`inline-flex items-center w-fit rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                                match.status === "live"
                                  ? "bg-green-100 text-green-800"
                                  : match.status === "finished"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {match.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatMatchDate(match.matchDate)}
                            </span>
                            {match.venue && (
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                {match.venue}
                              </span>
                            )}
                            {match.accessPrice > 0 && (
                              <Link
                                href="/subscription"
                                className="inline-flex px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                              >
                                Get Access
                              </Link>
                            )}
                            <Link
                              href={`/matches/${match.id}`}
                              className="inline-flex px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>

                        {products.length > 0 && (
                          <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">
                              Shop {match.homeTeam} & {match.awayTeam} merchandise
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                              {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                              ))}
                            </div>
                            <Link
                              href={`/shop?search=${encodeURIComponent(match.homeTeam)}`}
                              className="inline-flex items-center text-red-600 font-medium hover:underline mt-4 text-sm"
                            >
                              View all {match.homeTeam} & {match.awayTeam} products →
                            </Link>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <MatchesPagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  perPage={PER_PAGE}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
