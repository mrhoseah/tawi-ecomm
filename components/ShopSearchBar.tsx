"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";

interface ShopSearchBarProps {
  categories?: string[];
  teams?: string[];
}

export default function ShopSearchBar({ categories = [], teams = [] }: ShopSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(target)) setCategoryOpen(false);
      if (teamRef.current && !teamRef.current.contains(target)) setTeamOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCategoryOpen(false);
        setTeamOpen(false);
      }
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
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    
    const category = searchParams.get("category");
    const team = searchParams.get("team");
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const onSale = searchParams.get("onSale");
    const sort = searchParams.get("sort");
    if (category) params.set("category", category);
    if (team) params.set("team", team);
    if (size) params.set("size", size);
    if (color) params.set("color", color);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", inStock);
    if (onSale) params.set("onSale", onSale);
    if (sort) params.set("sort", sort);

    router.push(`/shop?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    const params = new URLSearchParams();

    const category = searchParams.get("category");
    const team = searchParams.get("team");
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const onSale = searchParams.get("onSale");
    const sort = searchParams.get("sort");
    if (category) params.set("category", category);
    if (team) params.set("team", team);
    if (size) params.set("size", size);
    if (color) params.set("color", color);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", inStock);
    if (onSale) params.set("onSale", onSale);
    if (sort) params.set("sort", sort);

    router.push(`/shop?${params.toString()}`);
    inputRef.current?.focus();
  };

  const selectedCategory = searchParams.get("category") || "";
  const selectedTeam = searchParams.get("team") || "";
  const filteredCategories =
    categories.length > 0
      ? categories.filter((c) =>
          c.toLowerCase().includes(categorySearch.toLowerCase())
        )
      : [];
  const filteredTeams =
    teams.length > 0
      ? teams.filter((t) =>
          t.toLowerCase().includes(teamSearch.toLowerCase())
        )
      : [];

  const handleCategorySelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    router.push(`/shop?${params.toString()}`);
    setCategoryOpen(false);
  };

  const handleTeamSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("team", value);
    else params.delete("team");
    router.push(`/shop?${params.toString()}`);
    setTeamOpen(false);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form
          onSubmit={handleSearch}
          className="w-full md:flex-1"
        >
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search products..."
              className="w-full pl-12 pr-10 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
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
        </form>

        {categories.length > 0 && (
          <div ref={categoryRef} className="relative w-full md:w-48">
            <button
              type="button"
              onClick={() => { setCategoryOpen((o) => !o); setTeamOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm hover:border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              aria-expanded={categoryOpen}
              aria-haspopup="listbox"
              aria-label="Filter by category"
            >
              <span className="truncate text-left">
                {selectedCategory ? selectedCategory : "All categories"}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
            </button>
            {categoryOpen && (
              <div
                role="listbox"
                className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black/5"
              >
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  <button type="button" onClick={() => handleCategorySelect("")}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedCategory === "" ? "bg-gray-50 font-medium" : ""}`}>
                    All categories
                  </button>
                  {(filteredCategories.length > 0 ? filteredCategories : categories).map((c) => (
                    <button key={c} type="button" onClick={() => handleCategorySelect(c)}
                      className={`w-full text-left px-3 py-2 text-sm capitalize hover:bg-gray-50 ${selectedCategory === c ? "bg-red-50 text-red-700 font-medium" : ""}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {teams.length > 0 && (
          <div ref={teamRef} className="relative w-full md:w-48">
            <button
              type="button"
              onClick={() => { setTeamOpen((o) => !o); setCategoryOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm hover:border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              aria-expanded={teamOpen}
              aria-haspopup="listbox"
              aria-label="Filter by team"
            >
              <span className="truncate text-left">
                {selectedTeam ? selectedTeam : "All teams"}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${teamOpen ? "rotate-180" : ""}`} />
            </button>
            {teamOpen && (
              <div
                role="listbox"
                className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black/5"
              >
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Search teams..."
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  <button type="button" onClick={() => handleTeamSelect("")}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedTeam === "" ? "bg-gray-50 font-medium" : ""}`}>
                    All teams
                  </button>
                  {(filteredTeams.length > 0 ? filteredTeams : teams).map((t) => (
                    <button key={t} type="button" onClick={() => handleTeamSelect(t)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selectedTeam === t ? "bg-red-50 text-red-700 font-medium" : ""}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {searchQuery && (
        <div className="text-sm text-gray-600">
          Press Enter to search or click the search icon
        </div>
      )}
    </div>
  );
}

