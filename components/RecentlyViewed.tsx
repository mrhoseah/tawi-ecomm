"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentlyViewed } from "@/lib/recentlyViewed";

export default function RecentlyViewed() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const viewed = getRecentlyViewed();
    if (viewed.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch products from API
    fetch(`/api/products?ids=${viewed.map((v) => v.id).join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        // Maintain order from recently viewed
        const ordered = viewed
          .map((v) => data.products?.find((p: any) => p.id === v.id))
          .filter(Boolean);
        setProducts(ordered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-red-600 font-bold text-sm">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

