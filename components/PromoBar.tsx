import Link from "next/link";
import { Truck, Tag } from "lucide-react";

export default function PromoBar() {
  return (
    <div className="bg-gray-900 text-white py-2 text-center text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-red-400" />
            Free shipping on orders over $50
          </span>
          <span className="hidden sm:inline text-gray-500">|</span>
          <Link
            href="/shop?onSale=true"
            className="flex items-center gap-2 hover:text-red-400 transition-colors"
          >
            <Tag className="h-4 w-4 text-red-400" />
            Shop Sale
          </Link>
        </div>
      </div>
    </div>
  );
}
