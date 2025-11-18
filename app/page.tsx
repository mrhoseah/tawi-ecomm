import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCarousel from "@/components/ProductCarousel";
import { ArrowRight, Star, Shield, Truck, Headphones } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true, active: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-red-600 to-red-800 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Premium Sports Jerseys
                <br />
                <span className="text-red-200">For True Fans</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-2xl mx-auto">
                Owned by Tawi TV - Your trusted sports broadcasting partner.
                Get authentic jerseys and athletic apparel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/shop?category=jerseys"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
                >
                  Browse Jerseys
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <Truck className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
                <p className="text-gray-600 text-sm">
                  Free shipping on orders over $50
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Authentic Products</h3>
                <p className="text-gray-600 text-sm">
                  100% authentic jerseys guaranteed
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <Headphones className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
                <p className="text-gray-600 text-sm">
                  Customer support whenever you need
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <Star className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
                <p className="text-gray-600 text-sm">
                  Top quality materials and craftsmanship
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Carousel */}
        {featuredProducts.length > 0 && (
          <>
            <ProductCarousel
              products={featuredProducts}
              title="Featured Products"
              subtitle="Check out our most popular items"
            />
            <div className="text-center pb-16">
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Show Your Team Spirit?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of fans who trust Tawi Shop for their sports
              apparel needs.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
