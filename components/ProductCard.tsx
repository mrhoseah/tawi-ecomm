"use client";

import Link from "next/link";
import QuickAddToCart from "./QuickAddToCart";
import WishlistButton from "./WishlistButton";
import QuickViewButton from "./QuickViewButton";
import { Star, Badge } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
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

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
}

export default function ProductCard({ product, view = "grid" }: ProductCardProps) {
  if (view === "list") {
    return (
      <div className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          <Link
            href={`/product/${product.slug}`}
            className="w-full sm:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0"
          >
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            {product.compareAtPrice && (
              <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                Sale
              </span>
            )}
            {product.newArrival && (
              <span className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                New
              </span>
            )}
            <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <WishlistButton productId={product.id} />
              <QuickAddToCart product={product} variant="icon" />
            </div>
          </Link>
          <div className="flex-1">
            <Link href={`/product/${product.slug}`}>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-red-600 transition-colors">
                {product.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mb-2">
              {product.rating > 0 && (
                <>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium ml-1">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({product.reviewCount})
                  </span>
                </>
              )}
              <span className="text-sm text-gray-500 capitalize">
                {product.category}
              </span>
            </div>
            <div className="mb-4">
              {product.compareAtPrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-bold text-xl">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-gray-400 line-through text-sm">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-gray-900 font-bold text-xl">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <QuickAddToCart product={product} variant="button" className="text-sm" />
              <QuickViewButton product={product} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      <Link href={`/product/${product.slug}`} className="block">
          <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
            {product.compareAtPrice && (
              <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                Sale
              </span>
            )}
            {product.newArrival && (
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                New
              </span>
            )}
            {product.bestSeller && (
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                Best Seller
              </span>
            )}
          </div>
          <QuickViewButton
            product={product}
            className="opacity-0 group-hover:opacity-100"
          />
        </div>
      </Link>
      <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <WishlistButton
          productId={product.id}
          className="opacity-0 group-hover:opacity-100"
        />
        <QuickAddToCart
          product={product}
          variant="icon"
          className="opacity-0 group-hover:opacity-100"
        />
      </div>
      <div className="p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({product.reviewCount})</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <div>
            {product.compareAtPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-bold text-lg">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-gray-400 line-through text-sm">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-gray-900 font-bold text-lg">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500 capitalize">
            {product.category}
          </span>
        </div>
        <QuickAddToCart
          product={product}
          variant="button"
          className="w-full text-sm"
        />
      </div>
    </div>
  );
}

