"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { X, Filter } from "lucide-react";

interface ProductFiltersProps {
  categories: string[];
  sizes: string[];
  colors: string[];
  priceRange: { min: number; max: number };
}

export default function ProductFilters({
  categories,
  sizes,
  colors,
  priceRange,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    inStock: searchParams.get("inStock") === "true",
    onSale: searchParams.get("onSale") === "true",
  });
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  const applyFilters = useCallback(() => {
    if (isInitialMount) return;

    const params = new URLSearchParams();

    if (searchParams.get("search")) {
      params.set("search", searchParams.get("search")!);
    }

    if (filters.category) params.set("category", filters.category);
    const team = searchParams.get("team");
    if (team) params.set("team", team);
    if (filters.size) params.set("size", filters.size);
    if (filters.color) params.set("color", filters.color);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.inStock) params.set("inStock", "true");
    if (filters.onSale) params.set("onSale", "true");
    if (searchParams.get("sort")) {
      params.set("sort", searchParams.get("sort")!);
    }

    router.push(`/shop?${params.toString()}`);
    setIsMobileOpen(false);
  }, [filters, searchParams, router, isInitialMount]);

  useEffect(() => {
    if (isInitialMount) return;
    applyFilters();
  }, [filters.category, filters.size, filters.color, filters.inStock, filters.onSale, applyFilters, isInitialMount]);

  useEffect(() => {
    if (isInitialMount) return;
    const t = setTimeout(applyFilters, 800);
    return () => clearTimeout(t);
  }, [filters.minPrice, filters.maxPrice, applyFilters, isInitialMount]);

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.get("search")) {
      params.set("search", searchParams.get("search")!);
    }
    if (searchParams.get("sort")) {
      params.set("sort", searchParams.get("sort")!);
    }
    setFilters({
      category: "",
      size: "",
      color: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      onSale: false,
    });
    router.push(`/shop?${params.toString()}`);
  };

  const hasActiveFilters =
    filters.category ||
    searchParams.get("team") ||
    filters.size ||
    filters.color ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.inStock ||
    filters.onSale;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="font-medium mb-3">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              value=""
              checked={filters.category === ""}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="mr-2"
            />
            <span className="text-sm">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="radio"
                name="category"
                value={category}
                checked={filters.category === category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="mr-2"
              />
              <span className="text-sm capitalize">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            min={0}
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            min={0}
          />
        </div>
      </div>

      {/* Sizes */}
      {sizes.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() =>
                  setFilters({
                    ...filters,
                    size: filters.size === size ? "" : size,
                  })
                }
                className={`px-3 py-1 border rounded-lg text-sm transition-colors ${
                  filters.size === size
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white border-gray-300 hover:border-red-600"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Color</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() =>
                  setFilters({
                    ...filters,
                    color: filters.color === color ? "" : color,
                  })
                }
                className={`px-3 py-1 border rounded-lg text-sm capitalize transition-colors ${
                  filters.color === color
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white border-gray-300 hover:border-red-600"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <h3 className="font-medium mb-3">Availability</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) =>
              setFilters({ ...filters, inStock: e.target.checked })
            }
            className="mr-2"
          />
          <span className="text-sm">In Stock Only</span>
        </label>
      </div>

      {/* On Sale */}
      <div>
        <h3 className="font-medium mb-3">Special Offers</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={(e) =>
              setFilters({ ...filters, onSale: e.target.checked })
            }
            className="mr-2"
          />
          <span className="text-sm">On Sale</span>
        </label>
      </div>

      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm mb-4"
      >
        <Filter className="h-5 w-5" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
            Active
          </span>
        )}
      </button>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50">
          <div className="bg-white h-full w-80 max-w-[90vw] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b">
              <h2 className="text-xl font-bold">Filters</h2>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      <div className="hidden lg:block bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>
        <FilterContent />
      </div>
    </>
  );
}
