"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import QuickAddToCart from "@/components/QuickAddToCart";

export default function WishlistPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/sign-in?callbackUrl=/wishlist");
      return;
    }

    // Load wishlist from localStorage
    const wishlist = JSON.parse(
      localStorage.getItem("wishlist") || "[]"
    ) as string[];

    if (wishlist.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch products
    fetch(`/api/products?ids=${wishlist.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, router]);

  const removeFromWishlist = (productId: string) => {
    const wishlist = JSON.parse(
      localStorage.getItem("wishlist") || "[]"
    ) as string[];
    const updated = wishlist.filter((id) => id !== productId);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    setProducts(products.filter((p) => p.id !== productId));
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">
              Start adding items to your wishlist to see them here.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow relative"
              >
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-red-600 hover:text-white transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Heart className="h-5 w-5 fill-red-600 group-hover:fill-white" />
                </button>
                <Link href={`/product/${product.slug}`}>
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
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
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="font-semibold mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mb-3">
                    {product.compareAtPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-gray-400 line-through text-sm">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-bold">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <QuickAddToCart
                    product={product}
                    variant="button"
                    className="w-full text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

