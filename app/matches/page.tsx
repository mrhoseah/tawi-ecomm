import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import ProductCard from "@/components/ProductCard";
import MatchesSearchBar from "@/components/MatchesSearchBar";
import MatchesPagination from "@/components/MatchesPagination";
import { Trophy, Calendar, MapPin, X, Play } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />
      <main className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.35),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(248,250,252,0.08),_transparent_55%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-200 ring-1 ring-inset ring-red-500/40 mb-4">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.45)]" />
                  Live & upcoming fixtures
                </div>
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50 mb-3 flex items-center gap-3">
                  <Trophy className="h-9 w-9 text-red-300 drop-shadow-sm" />
                  Matches
                </h1>
                <p className="max-w-2xl text-base md:text-lg text-slate-200/85">
                  Discover live games, upcoming fixtures, and final scores in one advanced match hub.
                  Filter by status, search by team, and jump straight into the action or checkout in a few clicks.
                </p>
              </div>
              <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-slate-900/70 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.8)] ring-1 ring-white/10 backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Quick overview
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2.5">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mb-1">
                      Total matches
                    </p>
                    <p className="text-xl font-semibold text-slate-50">{total}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2.5">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mb-1">
                      Per page
                    </p>
                    <p className="text-xl font-semibold text-slate-50">{PER_PAGE}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2.5">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-400 mb-1">
                      Page
                    </p>
                    <p className="text-xl font-semibold text-slate-50">
                      {page} <span className="text-xs text-slate-400">/ {totalPages}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Search & Filters */}
          <div className="mb-6 sm:mb-8 rounded-2xl bg-slate-900/60 p-4 sm:p-5 ring-1 ring-white/10 shadow-[0_18px_45px_rgba(15,23,42,0.7)] backdrop-blur">
            <MatchesSearchBar />

            {/* Active filter chips */}
            {(params.search || params.status) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {params.search && (
                  <Link
                    href={buildClearParams(params, "search")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-red-100 shadow-sm backdrop-blur hover:border-red-300/70 hover:bg-red-500/15 transition-colors"
                  >
                    <span>Search: {params.search}</span>
                    <X className="h-3 w-3" />
                  </Link>
                )}
                {params.status && (
                  <Link
                    href={buildClearParams(params, "status")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-red-100 shadow-sm backdrop-blur hover:border-red-300/70 hover:bg-red-500/15 transition-colors"
                  >
                    <span className="capitalize">Status: {params.status}</span>
                    <X className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-300">
              <span className="font-semibold text-slate-50">{total}</span> match
              {total !== 1 ? "es" : ""} found
            </p>
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" />
              Real-time fixtures synced with your match catalogue
            </div>
          </div>

          {matches.length === 0 ? (
            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black px-6 py-16 text-center shadow-[0_25px_70px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(248,113,113,0.22),_transparent_50%)]" />
              <div className="relative mx-auto max-w-xl">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/80 ring-1 ring-white/15">
                  <Trophy className="h-8 w-8 text-slate-500" />
                </div>
                <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-50">
                  No matches match your filters
                </h2>
                <p className="mx-auto mb-6 max-w-md text-sm text-slate-300">
                  Try relaxing your filters, clearing the search term, or checking back later for new fixtures being
                  added to the schedule.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/matches"
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(220,38,38,0.6)] transition-colors hover:bg-red-500"
                  >
                    Reset filters
                  </Link>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="inline-flex items-center rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-white/25 hover:bg-slate-900/90 transition-colors"
                  >
                    Back to top
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <div className="space-y-6 sm:space-y-8">
                {matches.map(async (match) => {
                  const teams = [match.homeTeam, match.awayTeam];
                  const products = await getProductsForTeams(teams);
                  return (
                    <section
                      key={match.id}
                      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-[0_24px_70px_rgba(15,23,42,0.95)] transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_32px_90px_rgba(15,23,42,1)]"
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-red-500/15 blur-3xl" />
                        <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-slate-400/10 blur-3xl" />
                      </div>
                      <div className="relative p-5 sm:p-7 lg:p-8">
                        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link
                              href={`/matches/${match.id}`}
                              className="text-center sm:text-left"
                            >
                              <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 mb-1.5">
                                Featured fixture
                              </span>
                              <span className="text-xl sm:text-2xl font-semibold text-slate-50 transition-colors group-hover:text-red-300">
                                {match.homeTeam}
                              </span>
                              <span className="mx-2 hidden text-sm font-medium text-slate-400 sm:inline">vs</span>
                              <span className="text-xl sm:text-2xl font-semibold text-slate-50 transition-colors group-hover:text-red-300 sm:inline">
                                {match.awayTeam}
                              </span>
                            </Link>
                            <span
                              className={`inline-flex items-center w-fit rounded-full px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${
                                match.status === "live"
                                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/50"
                                  : match.status === "finished"
                                    ? "bg-slate-700/60 text-slate-200 ring-1 ring-inset ring-slate-500/60"
                                    : "bg-red-500/15 text-red-200 ring-1 ring-inset ring-red-400/60"
                              }`}
                            >
                              {match.status === "live" && (
                                <span className="mr-1.5 inline-flex h-1.5 w-1.5 items-center justify-center">
                                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_0_3px_rgba(16,185,129,0.5)]" />
                                </span>
                              )}
                              {match.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{formatMatchDate(match.matchDate)}</span>
                            </span>
                            {match.venue && (
                              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                {match.venue}
                              </span>
                            )}
                            {match.accessPrice > 0 && (
                              <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-200">
                                Paid access
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xs text-slate-400">
                            <p>Secure HD stream access in a few clicks. Your purchase automatically unlocks the match in your account.</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {match.status === "live" ? (
                              <Link
                                href={`/matches/${match.id}/watch`}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(220,38,38,0.7)] transition-colors hover:bg-red-500"
                              >
                                <Play className="h-4 w-4" />
                                Watch now
                              </Link>
                            ) : match.accessPrice > 0 ? (
                              <Link
                                href={`/matches/${match.id}/checkout`}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_15px_40px_rgba(220,38,38,0.7)] transition-colors hover:bg-red-500"
                              >
                                <Play className="h-4 w-4" />
                                Get access
                              </Link>
                            ) : null}
                            <Link
                              href={`/matches/${match.id}`}
                              className="inline-flex items-center rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 hover:border-white/25 hover:bg-slate-900/90 transition-colors"
                            >
                              View details
                            </Link>
                          </div>
                        </div>

                        {products.length > 0 && (
                          <div className="mt-5 border-t border-white/10 pt-6">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold text-slate-100">
                                Shop {match.homeTeam} &amp; {match.awayTeam} merchandise
                              </h3>
                              <Link
                                href={`/shop?search=${encodeURIComponent(match.homeTeam)}`}
                                className="hidden text-xs font-medium uppercase tracking-[0.18em] text-red-300 hover:text-red-200 sm:inline-flex"
                              >
                                View all
                              </Link>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                              ))}
                            </div>
                            <Link
                              href={`/shop?search=${encodeURIComponent(match.homeTeam)}`}
                              className="mt-4 inline-flex items-center text-xs font-medium uppercase tracking-[0.18em] text-red-300 hover:text-red-200 sm:hidden"
                            >
                              View all {match.homeTeam} &amp; {match.awayTeam} products →
                            </Link>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 sm:mt-10 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-5 ring-1 ring-white/5">
                  <MatchesPagination page={page} totalPages={totalPages} total={total} perPage={PER_PAGE} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
