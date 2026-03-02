import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Shop",
  description: "Jerseys, accessories, and official merchandise. Filter by team, category, size, color, and more.",
};
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SortDropdown from "@/components/SortDropdown";
import ProductFilters from "@/components/ProductFilters";
import ShopSearchBar from "@/components/ShopSearchBar";
import ShopClient from "./ShopClient";
import { X } from "lucide-react";

interface SearchParams {
  category?: string;
  team?: string;
  search?: string;
  sort?: string;
  size?: string;
  color?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  onSale?: string;
}

async function getProducts(searchParams: SearchParams) {
  const where: any = { active: true };

  if (searchParams.category) {
    where.category = searchParams.category;
  }

  if (searchParams.team) {
    where.tags = { has: searchParams.team };
  }

  if (searchParams.size) {
    where.sizes = { has: searchParams.size };
  }

  if (searchParams.color) {
    where.colors = { has: searchParams.color };
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    where.price = {};
    if (searchParams.minPrice) {
      where.price.gte = parseFloat(searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      where.price.lte = parseFloat(searchParams.maxPrice);
    }
  }

  if (searchParams.inStock === "true") {
    where.stock = { gt: 0 };
  }

  if (searchParams.onSale === "true") {
    where.compareAtPrice = { not: null };
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
      { tags: { has: searchParams.search } },
    ];
  }

  const orderBy: any = { createdAt: "desc" };
  if (searchParams.sort === "price-asc") {
    orderBy.price = "asc";
  } else if (searchParams.sort === "price-desc") {
    orderBy.price = "desc";
  } else if (searchParams.sort === "name") {
    orderBy.name = "asc";
  }

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy,
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

async function getCategories() {
  try {
    const categories = await prisma.product.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ["category"],
    });
    return categories.map((c: { category: string }) => c.category);
  } catch (error) {
    return [];
  }
}

async function getTeams() {
  try {
    const teams = await prisma.team.findMany({
      where: { active: true },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return teams.map((t) => t.name);
  } catch (error) {
    return [];
  }
}

async function getFilterOptions() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        sizes: true,
        colors: true,
        price: true,
        compareAtPrice: true,
      },
    });

    const allSizes = new Set<string>();
    const allColors = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    products.forEach((product: { sizes: string[]; colors: string[]; price: number; compareAtPrice: number | null }) => {
      product.sizes.forEach((size: string) => allSizes.add(size));
      product.colors.forEach((color: string) => allColors.add(color));
      minPrice = Math.min(minPrice, product.price);
      maxPrice = Math.max(maxPrice, product.compareAtPrice || product.price);
    });

    return {
      sizes: Array.from(allSizes).sort(),
      colors: Array.from(allColors).sort(),
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: Math.ceil(maxPrice),
      },
    };
  } catch (error) {
    return {
      sizes: [],
      colors: [],
      priceRange: { min: 0, max: 1000 },
    };
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const products = await getProducts(params);
  const categories = await getCategories();
  const teams = await getTeams();
  const filterOptions = await getFilterOptions();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Hero section */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Shop</h1>
            <p className="text-red-100 text-lg max-w-2xl">
              Jerseys, accessories, and official merchandise for your favorite teams. Filter by team, category, size, and more.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <ShopSearchBar categories={categories} teams={teams} />

            {/* Active filters chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {params.team && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("team");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white"
                >
                  <span>Team: {params.team}</span>
                  <X className="h-3 w-3" />
                </Link>
              )}
              {params.category && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("category");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white"
                >
                  <span>Category: {params.category}</span>
                  <X className="h-3 w-3" />
                </Link>
              )}
              {params.size && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("size");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white"
                >
                  <span>Size: {params.size}</span>
                  <X className="h-3 w-3" />
                </Link>
              )}
              {params.color && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("color");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-medium capitalize"
                >
                  <span>Color: {params.color}</span>
                  <X className="h-3 w-3" />
                </Link>
              )}
              {(params.minPrice || params.maxPrice) && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("minPrice");
                    sp.delete("maxPrice");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white"
                >
                  <span>
                    Price:
                    {params.minPrice && ` from $${params.minPrice}`}
                    {params.maxPrice && ` to $${params.maxPrice}`}
                  </span>
                  <X className="h-3 w-3" />
                </Link>
              )}
              {params.inStock === "true" && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("inStock");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white"
                >
                  <span>In stock only</span>
                  <X className="h-3 w-3" />
                </Link>
              )}
              {params.onSale === "true" && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("onSale");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white"
                >
                  <span>On sale</span>
                  <X className="h-3 w-3" />
                </Link>
              )}
              {params.search && (
                <Link
                  href={(() => {
                    const sp = new URLSearchParams(params as any);
                    sp.delete("search");
                    const qs = sp.toString();
                    return qs ? `/shop?${qs}` : "/shop";
                  })()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 text-red-800 px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-white"
                >
                  <span>Search: {params.search}</span>
                  <X className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-72 xl:w-80 flex-shrink-0">
              <ProductFilters
                categories={categories}
                sizes={filterOptions.sizes}
                colors={filterOptions.colors}
                priceRange={filterOptions.priceRange}
              />
            </aside>

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              <ShopClient products={products} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

