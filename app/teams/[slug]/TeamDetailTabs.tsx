"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Newspaper, Trophy, ShoppingBag } from "lucide-react";
import ProductCard from "@/components/ProductCard";

interface TeamDetailTabsProps {
  teamName: string;
  teamSlug: string;
}

function formatMatchDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeamDetailTabs({ teamName, teamSlug }: TeamDetailTabsProps) {
  const [tab, setTab] = useState<"news" | "matches" | "shop">("news");
  const [news, setNews] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (tab === "news") {
      fetch("/api/news")
        .then((res) => res.json())
        .then((data) => {
          const filtered = (data || []).filter((n: any) =>
            (n.teams || []).some((t: string) => t.toLowerCase().includes(teamName.toLowerCase()))
          );
          setNews(filtered);
        })
        .catch(() => setNews([]))
        .finally(() => setLoading(false));
    } else if (tab === "matches") {
      fetch("/api/matches")
        .then((res) => res.json())
        .then((data) => {
          const all = data || [];
          const filtered = all.filter(
            (m: any) =>
              m.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
              m.awayTeam.toLowerCase().includes(teamName.toLowerCase())
          );
          const now = new Date();
          const currentAndFuture = filtered
            .filter((m: any) => new Date(m.matchDate) >= now)
            .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
          setMatches(currentAndFuture);
        })
        .catch(() => setMatches([]))
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/products?teams=${encodeURIComponent(teamName)}`)
        .then((res) => res.json())
        .then((data) => setProducts(data?.products || []))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }
  }, [tab, teamName, teamSlug]);

  const tabs = [
    { id: "news" as const, label: "News", icon: Newspaper },
    { id: "matches" as const, label: "Matches", icon: Trophy },
    { id: "shop" as const, label: "Shop", icon: ShoppingBag },
  ];

  return (
    <div>
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors -mb-px ${
                tab === id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : tab === "news" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {news.length === 0 ? (
            <p className="text-gray-500 py-8">No news for this team yet.</p>
          ) : (
            news.map((item) => (
              <Link
                key={item.id}
                href="/news"
                className="rounded-xl border p-6 hover:border-red-200 transition-colors"
              >
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                {item.excerpt && <p className="text-gray-600 line-clamp-2">{item.excerpt}</p>}
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(item.publishedAt).toLocaleDateString()}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : tab === "matches" ? (
        <div className="space-y-4">
          {matches.length === 0 ? (
            <p className="text-gray-500 py-8">No upcoming matches for this team.</p>
          ) : (
            matches.map((match) => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="flex items-center justify-between p-4 rounded-xl border hover:border-red-200 transition-colors"
              >
                <div>
                  <span className="font-semibold">{match.homeTeam}</span>
                  <span className="mx-2 text-gray-400">vs</span>
                  <span className="font-semibold">{match.awayTeam}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{formatMatchDate(match.matchDate)}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      match.status === "live"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {match.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <p className="text-gray-500 py-8 col-span-full">
              No products for this team yet.{" "}
              <Link href="/shop" className="text-red-600 hover:underline">
                Browse all products
              </Link>
            </p>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
