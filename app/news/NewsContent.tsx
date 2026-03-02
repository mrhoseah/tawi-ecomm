"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Calendar, ChevronRight, Newspaper } from "lucide-react";

type NewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  teams: string[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function formatNewsDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TeamBadgeLink({
  team,
  variant = "default",
  badgeClassName,
}: {
  team: string;
  variant?: "default" | "secondary";
  badgeClassName?: string;
}) {
  const router = useRouter();
  const href = `/shop?team=${encodeURIComponent(team)}`;
  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(href);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          router.push(href);
        }
      }}
      className="cursor-pointer hover:opacity-90"
    >
      <Badge variant={variant} className={badgeClassName ?? "text-xs"}>
        {team}
      </Badge>
    </span>
  );
}

export function NewsContent({
  news,
}: {
  news: NewsItem[];
}) {
  const [featured, ...rest] = news;

  if (news.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">No news yet</p>
        <p className="text-gray-500 mt-2 text-sm">
          Check back soon for match reports and team updates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Featured story */}
      {featured && (
        <Link href={`/news/${featured.id}`} className="block group">
          <article className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-transparent to-transparent opacity-60" />
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
            <div className="relative p-8 md:p-10">
              <div className="flex flex-wrap gap-2 mb-4">
                {featured.teams.map((team) => (
                  <TeamBadgeLink key={team} team={team} variant="default" badgeClassName="text-xs" />
                ))}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors max-w-3xl">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="text-gray-600 text-lg mb-4 line-clamp-2 max-w-2xl">
                  {featured.excerpt}
                </p>
              )}
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {formatNewsDate(featured.publishedAt)}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-red-600 group-hover:gap-2 transition-all">
                  Read more
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* News grid */}
      {rest.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-gray-900">More Stories</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="group"
              >
                <article className="h-full rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-300">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.teams.map((team) => (
                      <TeamBadgeLink
                        key={team}
                        team={team}
                        variant="secondary"
                        badgeClassName="text-xs hover:bg-red-50 hover:text-red-700"
                      />
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.excerpt}
                    </p>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatNewsDate(item.publishedAt)}
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
