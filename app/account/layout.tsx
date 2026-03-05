"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { User, MapPin, LayoutDashboard, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const navItems = [
  { href: "/account", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/account/addresses", icon: MapPin, label: "Addresses" },
  { href: "/account/settings", icon: User, label: "Settings" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const target = pathname || "/account";
      router.replace(`/sign-in?callbackUrl=${encodeURIComponent(target)}`);
    }
  }, [status, pathname, router]);

  if (status === "loading" || status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={(session.user as any)?.image}
                      fallback={session.user?.name || "U"}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {session.user?.name || "Member"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <nav className="p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-red-50 text-red-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                        <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
