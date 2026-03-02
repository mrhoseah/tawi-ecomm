"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Newspaper, Trophy } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string | null;
  teams: string[];
}

interface MatchItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  venue: string | null;
  accessPrice: number;
}

interface CarouselData {
  news: NewsItem | null;
  upcomingMatch: MatchItem | null;
}

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HeroCarousel() {
  const [data, setData] = useState<CarouselData | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    fetch("/api/home-carousel")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const slides: { type: "news" | "match" | "intro"; content: any }[] = [];
  if (data?.news) {
    slides.push({ type: "news", content: data.news });
  }
  if (data?.upcomingMatch) {
    slides.push({ type: "match", content: data.upcomingMatch });
  }
  slides.push({
    type: "intro",
    content: null,
  });

  const currentSlide = slides[slideIndex];
  const hasMultiple = slides.length > 1;

  useEffect(() => {
    if (!hasMultiple) return;
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [hasMultiple, slides.length]);

  if (!data && slides.length === 1 && currentSlide?.type === "intro") {
    return (
      <section className="relative bg-gradient-to-r from-red-600 to-red-800 text-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <p className="text-red-200 font-semibold uppercase tracking-wider mb-4">Welcome to</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Local Sports Hub</h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-2xl mx-auto">
              Your neighborhood destination for official jerseys, training wear, and match-day gear.
            </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/subscription"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Get Access <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-r from-red-600 to-red-800 text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="relative">
          {/* Slide content */}
          <div className="min-h-[280px] flex items-center">
            {currentSlide?.type === "news" && (
              <div className="w-full text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <Newspaper className="h-5 w-5 text-red-200" />
                  <span className="text-red-200 font-semibold uppercase tracking-wider">Breaking News</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold mb-4 max-w-3xl">
                  {currentSlide.content.title}
                </h2>
                {currentSlide.content.excerpt && (
                  <p className="text-lg md:text-xl text-red-100 mb-6 max-w-2xl">
                    {currentSlide.content.excerpt}
                  </p>
                )}
                <Link
                  href={`/news`}
                  className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Read Full Story <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            )}

            {currentSlide?.type === "match" && (
              <div className="w-full">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-red-200" />
                  <span className="text-red-200 font-semibold uppercase tracking-wider">Upcoming Match</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 max-w-4xl">
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                      <span className="text-2xl md:text-3xl font-bold bg-white/10 px-4 py-2 rounded">
                        {currentSlide.content.homeTeam.slice(0, 1)}
                      </span>
                      <span className="text-xl md:text-2xl font-bold">{currentSlide.content.homeTeam}</span>
                      <span className="text-red-200 font-semibold">VS</span>
                      <span className="text-xl md:text-2xl font-bold">{currentSlide.content.awayTeam}</span>
                      <span className="text-2xl md:text-3xl font-bold bg-white/10 px-4 py-2 rounded">
                        {currentSlide.content.awayTeam.slice(0, 1)}
                      </span>
                    </div>
                    <p className="text-red-100 mb-4">
                      {formatMatchDate(currentSlide.content.matchDate)}
                      {currentSlide.content.venue && ` • ${currentSlide.content.venue}`}
                    </p>
                    <Link
                      href="/subscription"
                      className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Get Access <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {currentSlide?.type === "intro" && (
              <div className="w-full text-center">
                <p className="text-red-200 font-semibold uppercase tracking-wider mb-4">Welcome to</p>
                <h1 className="text-4xl md:text-6xl font-bold mb-6">Local Sports Hub</h1>
                <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-2xl mx-auto">
                  Your neighborhood destination for official jerseys, training wear, and match-day gear.
                  Sign up and pay to access live matches.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/subscription"
                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Get Access <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Carousel controls */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => setSlideIndex((i) => (i - 1 + slides.length) % slides.length)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:translate-x-0 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => setSlideIndex((i) => (i + 1) % slides.length)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:-translate-x-0 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="flex justify-center gap-2 mt-6">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlideIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === slideIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
