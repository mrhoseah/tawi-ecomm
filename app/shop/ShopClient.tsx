"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductSkeleton from "@/components/ProductSkeleton";
import SortDropdown from "@/components/SortDropdown";
import ViewToggle from "@/components/ViewToggle";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  category: string;
  stock: number;
  rating: number;
  reviewCount: number;
  onSale?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  sizes?: string[];
  colors?: string[];
}

interface ShopClientProps {
  products: Product[];
}

export default function ShopClient({ products }: ShopClientProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <>
      {/* Sort and View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <p className="text-gray-600 text-sm font-medium">
          <span className="text-gray-900 font-semibold">{products.length}</span> product{products.length !== 1 ? "s" : ""} found
        </p>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onViewChange={setView} />
          <SortDropdown />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-600 text-lg mb-4">No products found</p>
          <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search</p>
          <Link
            href="/shop"
            className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            View all products
          </Link>
        </div>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              : "space-y-4"
          }
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} view={view} />
          ))}
        </div>
      )}
    </>
  );
}

