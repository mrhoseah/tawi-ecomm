"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All matches" },
  { value: "scheduled", label: "Upcoming" },
  { value: "live", label: "Live now" },
  { value: "finished", label: "Finished" },
];

const SORT_OPTIONS = [
  { value: "", label: "Date: Soonest" },
  { value: "date-desc", label: "Date: Newest first" },
];

export default function MatchesSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStatusOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    else params.delete("search");
    params.delete("page");
    router.push(`/matches?${params.toString()}`);
  };

  const selectedSort = searchParams.get("sort") || "";
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val) params.set("sort", val);
    else params.delete("sort");
    params.delete("page");
    router.push(`/matches?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    router.push(`/matches?${params.toString()}`);
  };

  const selectedStatus = searchParams.get("status") || "";
  const handleStatusSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    params.delete("page");
    router.push(`/matches?${params.toString()}`);
    setStatusOpen(false);
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by team name..."
            className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
            aria-label="Search matches"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div ref={statusRef} className="relative w-full sm:w-52">
          <button
            type="button"
            onClick={() => setStatusOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm font-medium hover:border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            aria-expanded={statusOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label ?? "All matches"}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${statusOpen ? "rotate-180" : ""}`}
            />
          </button>
          {statusOpen && (
            <div
              role="listbox"
              className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden"
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusSelect(opt.value)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                    selectedStatus === opt.value ? "bg-red-50 text-red-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <select
          value={selectedSort}
          onChange={handleSortChange}
          className="px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 min-w-[160px]"
          aria-label="Sort matches"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap"
        >
          Search
        </button>
      </form>
    </div>
  );
}
