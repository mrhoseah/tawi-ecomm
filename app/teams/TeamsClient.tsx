"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import ViewToggle from "@/components/ViewToggle";
import { Users, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sportType: string;
  description: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TeamsClient() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sportTypes, setSportTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sportTypeFilter, setSportTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sportTypeFilter) params.set("sportType", sportTypeFilter);
    params.set("page", String(page));
    params.set("limit", "12");
    fetch(`/api/teams?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setTeams(data.teams || []);
        setPagination(data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
        setSportTypes(data.sportTypes || []);
      })
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, [search, sportTypeFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSportTypeFilter("");
    setPage(1);
  };

  const hasFilters = search || sportTypeFilter;

  return (
    <div className="space-y-6">
      {/* Search & filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search teams by name or sport..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {sportTypes.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={sportTypeFilter}
                  onChange={(e) => {
                    setSportTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 min-w-[140px]"
                >
                  <option value="">All sports</option>
                  {sportTypes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear filters
              </button>
            )}
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </form>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{pagination.total}</span> team{pagination.total !== 1 ? "s" : ""} found
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 h-44 animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Users className="h-14 w-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No teams found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          <button
            onClick={clearFilters}
            className="mt-6 px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:border-red-100 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <Avatar src={team.logoUrl} fallback={team.name} size="lg" className="mb-4" />
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500 capitalize mt-1">{team.sportType}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-red-100 hover:shadow-sm transition-all group"
            >
              <Avatar src={team.logoUrl} fallback={team.name} size="md" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500 capitalize">{team.sportType}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} teams)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
