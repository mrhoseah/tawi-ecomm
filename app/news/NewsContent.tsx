\"use client\";

import { useMemo, useState } from \"react\";
import Link from \"next/link\";
import { useRouter } from \"next/navigation\";
import { Badge } from \"@/components/ui/Badge\";
import {
  Calendar,
  ChevronRight,
  Newspaper,
  Search,
} from \"lucide-react\";

type NewsItem = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  teams: string[];
  publishedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function formatNewsDate(date: string | Date) {
  return new Date(date).toLocaleDateString(\"en-US\", {
    month: \"short\",
    day: \"numeric\",
    year: \"numeric\",
  });
}

function TeamBadgeLink({
  team,
  variant = \"default\",
  badgeClassName,
}: {
  team: string;
  variant?: \"default\" | \"secondary\";
  badgeClassName?: string;
}) {
  const router = useRouter();
  const href = `/shop?team=${encodeURIComponent(team)}`;
  return (
    <span
      role=\"link\"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(href);
      }}
      onKeyDown={(e) => {
        if (e.key === \"Enter\" || e.key === \" \") {
          e.preventDefault();
          e.stopPropagation();
          router.push(href);
        }
      }}
      className=\"cursor-pointer hover:opacity-90\"
    >
      <Badge variant={variant} className={badgeClassName ?? \"text-xs\"}>
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
  const [search, setSearch] = useState(\"\");
  const [selectedTeam, setSelectedTeam] = useState<string | \"all\">(\"all\");

  const allTeams = useMemo(
    () =>
      Array.from(new Set(news.flatMap((item) => item.teams))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [news],
  );

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return news.filter((item) => {
      const matchesTeam =
        selectedTeam === \"all\" || item.teams.includes(selectedTeam);
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.excerpt ?? \"\").toLowerCase().includes(query);
      return matchesTeam && matchesQuery;
    });
  }, [news, search, selectedTeam]);

  const [featured, ...rest] = filteredNews;

  if (news.length === 0) {
    return (
      <div className=\"text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm\">
        <Newspaper className=\"h-16 w-16 text-gray-300 mx-auto mb-4\" />
        <p className=\"text-gray-600 text-lg font-medium\">No news yet</p>
        <p className=\"text-gray-500 mt-2 text-sm\">
          Check back soon for match reports and team updates.
        </p>
      </div>
    );
  }

  return (
    <div className=\"space-y-10\">
      <section className=\"flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between\">
        <div className=\"space-y-1\">
          <p className=\"text-xs font-semibold uppercase tracking-[0.2em] text-red-600\">
            Tawi Sports Desk
          </p>
          <h2 className=\"text-lg font-semibold text-gray-900 md:text-xl\">
            Explore the latest from your favorite teams
          </h2>
        </div>
        <div className=\"flex flex-col gap-3 md:flex-row md:items-center md:gap-4\">
          <div className=\"relative w-full md:w-72\">
            <Search className=\"pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400\" />
            <input
              type=\"search\"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder=\"Search stories, matches, teams...\"
              className=\"w-full rounded-full border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-xs focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20\"
            />
          </div>
          {allTeams.length > 0 && (
            <div className=\"flex flex-wrap gap-1.5\">
              <button
                type=\"button\"
                onClick={() => setSelectedTeam(\"all\")}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedTeam === \"all\"
                    ? \"border-red-600 bg-red-600 text-white shadow-sm\"
                    : \"border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-700\"
                }`}
              >
                All teams
              </button>
              {allTeams.slice(0, 6).map((team) => (
                <button
                  key={team}
                  type=\"button\"
                  onClick={() =>
                    setSelectedTeam((current) =>
                      current === team ? \"all\" : team,
                    )
                  }
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selectedTeam === team
                      ? \"border-red-600 bg-red-50 text-red-700\"
                      : \"border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-700\"
                  }`}
                >
                  {team}
                </button>
              ))}
              {allTeams.length > 6 && (
                <span className=\"rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500\">
                  +{allTeams.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {filteredNews.length === 0 ? (
        <div className=\"rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-12 text-center text-sm text-gray-600\">
          <p className=\"font-medium\">
            No stories match your filters just yet.
          </p>
          <p className=\"mt-1 text-xs text-gray-500\">
            Try clearing the search or choosing a different team.
          </p>
        </div>
      ) : (
        <>
          {featured && (
            <Link href={`/news/${featured.id}`} className=\"block group\">
              <article className=\"relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg ring-1 ring-slate-900/10 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-xl\">
                <div className=\"absolute inset-0 opacity-40\">
                  <div className=\"absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.28),transparent_55%)]\" />
                  <div className=\"absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),transparent_60%)]\" />
                </div>
                <div className=\"relative p-8 md:p-10\">
                  <div className=\"mb-5 flex items-center justify-between gap-3\">
                    <div className=\"flex flex-wrap gap-2\">
                      {featured.teams.map((team) => (
                        <TeamBadgeLink
                          key={team}
                          team={team}
                          variant=\"default\"
                          badgeClassName=\"border border-white/15 bg-white/10 text-[11px] font-medium text-white/90 backdrop-blur-sm\"
                        />
                      ))}
                    </div>
                    <span className=\"inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200/90\">
                      Featured Story
                    </span>
                  </div>
                  <h2 className=\"mb-3 max-w-3xl text-2xl font-semibold tracking-tight md:text-3xl md:leading-tight\">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className=\"mb-5 max-w-2xl text-sm text-slate-200/90 md:text-base line-clamp-3\">
                      {featured.excerpt}
                    </p>
                  )}
                  <div className=\"flex flex-wrap items-center gap-4 text-xs text-slate-200/80 md:text-sm\">
                    <span className=\"flex items-center gap-1.5\">
                      <Calendar className=\"h-3.5 w-3.5\" />
                      {formatNewsDate(featured.publishedAt)}
                    </span>
                    <span className=\"inline-flex items-center gap-1 text-red-200 group-hover:gap-1.5\">
                      Read full report
                      <ChevronRight className=\"h-3.5 w-3.5\" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          )}

          {rest.length > 0 && (
            <section className=\"space-y-4\">
              <div className=\"flex items-center justify-between gap-2\">
                <h3 className=\"text-sm font-semibold uppercase tracking-[0.28em] text-gray-500\">
                  More Stories
                </h3>
                <p className=\"text-xs text-gray-500\">
                  Showing {filteredNews.length.toString().padStart(2, \"0\")}{" "}
                  {filteredNews.length === 1 ? \"story\" : \"stories\"}
                </p>
              </div>
              <div className=\"grid gap-6 md:grid-cols-2 lg:grid-cols-3\">
                {rest.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.id}`}
                    className=\"group\"
                  >
                    <article className=\"flex h-full flex-col rounded-xl border border-gray-100 bg-white/90 p-5 shadow-sm ring-1 ring-gray-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md\">
                      <div className=\"mb-3 flex flex-wrap gap-1.5\">
                        {item.teams.map((team) => (
                          <TeamBadgeLink
                            key={team}
                            team={team}
                            variant=\"secondary\"
                            badgeClassName=\"border border-red-50 bg-red-50/60 text-[11px] font-medium text-red-700 hover:bg-red-100\"
                          />
                        ))}
                      </div>
                      <h4 className=\"mb-2 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-red-600 md:text-base\">
                        {item.title}
                      </h4>
                      {item.excerpt && (
                        <p className=\"mb-3 line-clamp-3 text-xs text-gray-600 md:text-sm\">
                          {item.excerpt}
                        </p>
                      )}
                      <div className=\"mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-gray-500\">
                        <span className=\"inline-flex items-center gap-1\">
                          <Calendar className=\"h-3 w-3\" />
                          {formatNewsDate(item.publishedAt)}
                        </span>
                        <span className=\"inline-flex items-center gap-1 font-medium text-red-600 opacity-0 transition group-hover:opacity-100\">
                          Read
                          <ChevronRight className=\"h-3 w-3\" />
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
