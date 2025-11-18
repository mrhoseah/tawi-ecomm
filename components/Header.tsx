"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, Menu, X, Search, Heart, Package } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/store";

export default function Header() {
  const { data: session } = useSession();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-red-600">TAWI</span>
            <span className="text-xl font-semibold">Shop</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/shop"
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/shop?category=jerseys"
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              Jerseys
            </Link>
            <Link
              href="/shop?category=apparel"
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              Apparel
            </Link>
            <Link
              href="/shop?category=accessories"
              className="text-gray-700 hover:text-red-600 transition-colors"
            >
              Accessories
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Link
                  href="/account"
                  className="hidden md:flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">{session.user?.name || "Account"}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="hidden md:block text-sm text-gray-700 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="hidden md:block text-sm text-gray-700 hover:text-red-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="hidden md:block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}

            {session && (
              <>
                <Link
                  href="/wishlist"
                  className="p-2 text-gray-700 hover:text-red-600 transition-colors"
                  title="Wishlist"
                >
                  <Heart className="h-6 w-6" />
                </Link>
                <Link
                  href="/orders"
                  className="p-2 text-gray-700 hover:text-red-600 transition-colors"
                  title="Orders"
                >
                  <Package className="h-6 w-6" />
                </Link>
              </>
            )}
            <Link
              href="/cart"
              className="relative flex items-center text-gray-700 hover:text-red-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/shop"
                className="text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/shop?category=jerseys"
                className="text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jerseys
              </Link>
              <Link
                href="/shop?category=apparel"
                className="text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Apparel
              </Link>
              <Link
                href="/shop?category=accessories"
                className="text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Accessories
              </Link>
              {session ? (
                <>
                  <Link
                    href="/account"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-700 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

