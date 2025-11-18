"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export default function ShopSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    
    // Preserve other filters
    const category = searchParams.get("category");
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const onSale = searchParams.get("onSale");
    const sort = searchParams.get("sort");

    if (category) params.set("category", category);
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
    
    // Preserve other filters
    const category = searchParams.get("category");
    const size = searchParams.get("size");
    const color = searchParams.get("color");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const onSale = searchParams.get("onSale");
    const sort = searchParams.get("sort");

    if (category) params.set("category", category);
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

  return (
    <form onSubmit={handleSearch} className="w-full mb-6">
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
          className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-base"
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
      {searchQuery && (
        <div className="mt-2 text-sm text-gray-600">
          Press Enter to search or click the search icon
        </div>
      )}
    </form>
  );
}

