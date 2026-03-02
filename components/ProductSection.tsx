import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductGrid from "./ProductGrid";

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

interface ProductSectionProps {
  products: Product[];
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  columns?: 2 | 3 | 4;
  bg?: "white" | "gray";
}

export default function ProductSection({
  products,
  title,
  subtitle,
  viewAllHref = "/shop",
  viewAllLabel = "View All",
  columns = 4,
  bg = "gray",
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section
      className={`py-20 ${bg === "gray" ? "bg-gray-50" : "bg-white"}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-red-600 font-semibold hover:text-red-700 transition-colors shrink-0"
            >
              {viewAllLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
        <ProductGrid products={products} columns={columns} />
      </div>
    </section>
  );
}
