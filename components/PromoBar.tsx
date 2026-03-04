"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
import { useEffect, useState } from "react";

type PromoItem = {
  id: string;
  code: string;
  label: string;
  href: string;
};

export default function PromoBar() {
  const [items, setItems] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/promo-bar")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const promoItems = items;
  // Only show the Shop Sale link when there is at least one active promo/offer
  const showShopSale = promoItems.length > 0;

  if (loading || (promoItems.length === 0 && !showShopSale)) {
    return null;
  }

  return (
    <div className="bg-gray-900 text-white py-2 text-center text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {promoItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 hover:text-red-400 transition-colors"
            >
              <Tag className="h-4 w-4 text-red-400 shrink-0" />
              {item.label}
            </Link>
          ))}
          {promoItems.length > 0 && showShopSale && (
            <span className="hidden sm:inline text-gray-500">|</span>
          )}
          {showShopSale && (
            <Link
              href="/shop?onSale=true"
              className="flex items-center gap-2 hover:text-red-400 transition-colors"
            >
              <Tag className="h-4 w-4 text-red-400 shrink-0" />
              Shop Sale
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
