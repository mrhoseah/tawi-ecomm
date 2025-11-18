import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SortDropdown from "@/components/SortDropdown";
import ProductFilters from "@/components/ProductFilters";
import ShopSearchBar from "@/components/ShopSearchBar";
import ShopClient from "./ShopClient";

interface SearchParams {
  category?: string;
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

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
      { tags: { has: searchParams.search } },
    ];
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
    return categories.map((c) => c.category);
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

    products.forEach((product) => {
      product.sizes.forEach((size) => allSizes.add(size));
      product.colors.forEach((color) => allColors.add(color));
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
  const filterOptions = await getFilterOptions();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Shop</h1>
            <ShopSearchBar />
            {params.category && (
              <p className="text-gray-600 mb-2">
                Category: <span className="font-semibold capitalize">{params.category}</span>
              </p>
            )}
            {params.search && (
              <p className="text-gray-600 mb-2">
                Search results for: <span className="font-semibold">"{params.search}"</span>
              </p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <ProductFilters
                categories={categories}
                sizes={filterOptions.sizes}
                colors={filterOptions.colors}
                priceRange={filterOptions.priceRange}
              />
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <ShopClient products={products} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

