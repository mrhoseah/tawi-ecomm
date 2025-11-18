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
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {products.length} product{products.length !== 1 ? "s" : ""} found
        </p>
        <div className="flex items-center gap-4">
          <ViewToggle view={view} onViewChange={setView} />
          <SortDropdown />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">No products found</p>
          <Link
            href="/shop"
            className="text-red-600 hover:underline"
          >
            View all products
          </Link>
        </div>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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

