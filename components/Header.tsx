"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, User, Menu, X, Heart, Package, Newspaper, Trophy, ShoppingBag, Users, ChevronDown, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { ADMIN_PATH } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";

export default function Header() {
  const { data: session } = useSession();
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-red-600">TAWI TV</span>
            <span className="text-xl font-semibold hidden sm:inline">Local Sports Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/news"
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <Newspaper className="h-4 w-4" />
              News
            </Link>
            <Link
              href="/matches"
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <Trophy className="h-4 w-4" />
              Matches
            </Link>
            <Link
              href="/shop"
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Shop
            </Link>
            <Link
              href="/teams"
              className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <Users className="h-4 w-4" />
              Teams
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {session ? (
              <div ref={userMenuRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <Avatar
                    src={(session.user as any)?.image}
                    fallback={session.user?.name || session.user?.email || ""}
                    size="sm"
                  />
                  <span className="text-sm font-medium max-w-[120px] truncate">{session.user?.name || session.user?.email || "Account"}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg ring-1 ring-black/5">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium truncate">{session.user?.name || "Account"}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 shrink-0 text-gray-400" />
                        My Account
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="h-4 w-4 shrink-0 text-gray-400" />
                        Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 shrink-0 text-gray-400" />
                        Wishlist
                      </Link>
                    </div>
                    {["admin", "support"].includes((session.user as any)?.role || "") && (
                      <div className="border-t border-gray-100 py-1">
                        <Link
                          href={ADMIN_PATH}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 shrink-0" />
                          Admin Dashboard
                        </Link>
                        <Link
                          href={`${ADMIN_PATH}/settings`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 shrink-0 text-gray-400" />
                          Settings
                        </Link>
                      </div>
                    )}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden md:block text-sm text-gray-700 hover:text-red-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="hidden md:block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}

            {itemCount > 0 && (
              <Link
                href="/cart"
                className="relative flex items-center text-gray-700 hover:text-red-600 transition-colors"
                title="Cart"
              >
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              </Link>
            )}

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
                href="/news"
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Newspaper className="h-4 w-4" />
                News
              </Link>
              <Link
                href="/matches"
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Trophy className="h-4 w-4" />
                Matches
              </Link>
              <Link
                href="/shop"
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag className="h-4 w-4" />
                Shop
              </Link>
              <Link
                href="/teams"
                className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                Teams
              </Link>
              {session ? (
                <>
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">Account</p>
                    <div className="flex flex-col gap-1">
                      <Link
                        href="/account"
                        className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4 shrink-0" />
                        My Account
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Package className="h-4 w-4 shrink-0" />
                        Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4 shrink-0" />
                        Wishlist
                      </Link>
                    </div>
                  </div>
                  {["admin", "support"].includes((session.user as any)?.role || "") && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 mb-2">Admin</p>
                      <div className="flex flex-col gap-1">
                        <Link
                          href={ADMIN_PATH}
                          className="flex items-center gap-2 py-2 px-3 rounded-lg text-red-600 font-medium hover:bg-red-50 hover:text-red-700 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 shrink-0" />
                          Dashboard
                        </Link>
                        <Link
                          href={`${ADMIN_PATH}/settings`}
                          className="flex items-center gap-2 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4 shrink-0" />
                          Settings
                        </Link>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-gray-700 hover:text-red-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
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

