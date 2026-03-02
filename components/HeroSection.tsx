"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Play, Truck, Shield, RotateCcw, Calendar, MapPin, ChevronRight } from "lucide-react";
import { getYouTubeVideoId } from "@/lib/youtube";

interface FeaturedMatch {
  imageUrl: string | null;
  videoUrl: string | null;
  title: string | null;
}

export interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue: string | null;
  accessPrice: number;
}

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=85";

const trustItems = [
  { icon: Truck, label: "Free shipping" },
  { icon: Shield, label: "100% authentic" },
  { icon: RotateCcw, label: "Easy returns" },
];

function formatMatchDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type HeroSectionProps = {
  upcomingMatches?: UpcomingMatch[];
};

export default function HeroSection({ upcomingMatches = [] }: HeroSectionProps) {
  const [featured, setFeatured] = useState<FeaturedMatch | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    fetch("/api/featured-match")
      .then((res) => res.json())
      .then(setFeatured)
      .catch(() => setFeatured(null));
  }, []);

  const videoId = featured?.videoUrl ? getYouTubeVideoId(featured.videoUrl) : null;
  const hasFeatured = featured?.imageUrl;
  const heroImage = hasFeatured ? featured!.imageUrl! : DEFAULT_HERO_IMAGE;
  const isVideoFeatured = hasFeatured && videoId;

  return (
    <>
      <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          {isVideoFeatured ? (
            <button
              onClick={() => setShowVideo(true)}
              type="button"
              className="group absolute inset-0 w-full h-full block cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset focus:ring-offset-0"
              aria-label="Play featured match"
            >
              <img
                src={heroImage}
                alt={featured?.title || "Featured Match"}
                className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              />
            </button>
          ) : (
            <Link href="/shop" className="group absolute inset-0 block">
              <img
                src={heroImage}
                alt="Sports jerseys and athletic gear"
                className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              />
            </Link>
          )}
          {/* Gradient overlay - left to right, ensures text legibility */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/75 to-transparent md:via-gray-950/60 md:to-transparent"
            aria-hidden
          />
        </div>

        {/* Content + Matches */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12 lg:gap-8">
            {/* Left: Hero content */}
            <div className="max-w-xl shrink-0">
              {hasFeatured && featured?.title ? (
              <>
                <p className="text-red-500 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-4">
                  Featured Now
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5">
                  {featured.title}
                </h1>
                <p className="text-gray-400 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                  Catch the latest action. Shop official jerseys and gear for your favorite teams.
                </p>
              </>
            ) : (
              <>
                <p className="text-red-500 text-xs md:text-sm font-semibold uppercase tracking-[0.2em] mb-4">
                  Official Tawi Shop
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5">
                  Gear up for{" "}
                  <span className="text-red-500">match day</span>
                </h1>
                <p className="text-gray-400 text-base md:text-lg mb-8 max-w-md leading-relaxed">
                  Authentic jerseys, training wear, and athletic apparel. Own the look.
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors shadow-lg shadow-red-900/25 hover:shadow-red-900/40"
              >
                Shop Now
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href="/matches"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm transition-colors"
              >
                Watch Matches
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              {trustItems.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-600" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
            </div>

            {/* Right: Upcoming matches cards */}
            {upcomingMatches.length > 0 && (
              <div className="shrink-0 w-full lg:w-[360px]">
                <p className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-4">Upcoming Matches</p>
                <div className="flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:gap-3 snap-x snap-mandatory">
                  {upcomingMatches.slice(0, 3).map((match) => (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="group flex-shrink-0 w-[280px] lg:w-full snap-start rounded-xl bg-gradient-to-br from-red-950/50 via-red-900/30 to-amber-950/40 backdrop-blur-md border border-red-500/30 p-4 hover:from-red-950/60 hover:via-red-900/40 hover:to-amber-950/50 hover:border-red-400/40 transition-all duration-200 shadow-lg shadow-black/20"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-white font-bold text-sm truncate group-hover:text-red-200 transition-colors">{match.homeTeam}</span>
                        <span className="text-red-500 font-bold text-xs shrink-0 px-2 py-1 rounded-md bg-red-500/20 border border-red-400/30">vs</span>
                        <span className="text-white font-bold text-sm truncate text-right group-hover:text-red-200 transition-colors">{match.awayTeam}</span>
                      </div>
                      <div className="space-y-1 text-xs text-amber-200/80">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-400/90" />
                          {formatMatchDate(match.matchDate)}
                        </span>
                        {match.venue && (
                          <span className="flex items-center gap-2 truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400/90" />
                            {match.venue}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-red-500/20">
                        {match.accessPrice > 0 ? (
                          <span className="text-amber-300 font-bold text-sm">KES {match.accessPrice.toFixed(0)}</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold text-sm">Free</span>
                        )}
                        <span className="text-amber-200/90 text-xs font-medium group-hover:text-amber-100 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5">
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/matches"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-amber-300/90 hover:text-amber-200 font-medium transition-colors"
                >
                  View all matches <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Video play button overlay (when video featured, only if no match cards to avoid overlap) */}
        {isVideoFeatured && upcomingMatches.length === 0 && (
          <button
            onClick={() => setShowVideo(true)}
            type="button"
            className="absolute right-8 bottom-1/2 translate-y-1/2 hidden lg:flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Play featured match"
          >
            <Play className="h-7 w-7 ml-1" fill="currentColor" />
          </button>
        )}
      </section>

      {showVideo && videoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setShowVideo(false)}
        >
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl z-10 px-2 py-1 transition-colors"
            aria-label="Close video"
          >
            &times;
          </button>
          <div
            className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="Featured Match Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
