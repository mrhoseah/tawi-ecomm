"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Heart,
  Star,
  Truck,
  ChevronRight,
  MapPin,
  User,
  ShoppingBag,
  ArrowLeftRight,
  ExternalLink,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { getTrackingUrl } from "@/lib/tracking";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  items?: { product: { name: string; images: string[] } }[];
}

interface Team {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  sportType: string;
}

const quickLinks = [
  { href: "/orders", icon: Package, label: "Orders", color: "bg-amber-50 text-amber-700" },
  { href: "/wishlist", icon: Heart, label: "Wishlist", color: "bg-rose-50 text-rose-700" },
  { href: "/account/addresses", icon: MapPin, label: "Addresses", color: "bg-blue-50 text-blue-700" },
  { href: "/returns", icon: ArrowLeftRight, label: "Returns", color: "bg-emerald-50 text-emerald-700" },
];

export default function AccountDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [preferredTeams, setPreferredTeams] = useState<Team[]>([]);
  const [returns, setReturns] = useState<{ orderId: string }[]>([]);
  const [addressCount, setAddressCount] = useState(0);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [preferredSaving, setPreferredSaving] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const wl = JSON.parse(localStorage.getItem("wishlist") || "[]") as string[];
    setWishlistCount(wl.length);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/account/preferred-teams").then((r) => r.json()),
      fetch("/api/order-returns").then((r) => r.json()).catch(() => []),
      fetch("/api/addresses").then((r) => r.json()).catch(() => ({ addresses: [] })),
    ])
      .then(([ordersData, prefData, returnsData, addressesData]) => {
        setOrders(ordersData.orders || []);
        setPreferredTeams(prefData.teams || []);
        setReturns(Array.isArray(returnsData) ? returnsData : []);
        setAddressCount(Array.isArray(addressesData.addresses) ? addressesData.addresses.length : 0);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const loadAllTeamsForPicker = () => {
    if (allTeams.length > 0) {
      setShowTeamPicker(true);
      return;
    }
    setTeamsLoading(true);
    fetch("/api/teams?limit=100")
      .then((r) => r.json())
      .then((d) => {
        setAllTeams(d.teams || []);
        setShowTeamPicker(true);
      })
      .catch(() => {})
      .finally(() => setTeamsLoading(false));
  };

  const addPreferredTeam = (team: Team) => {
    if (preferredTeams.some((t) => t.id === team.id)) return;
    const next = [...preferredTeams, team];
    setPreferredTeams(next);
    savePreferredTeams(next);
    setShowTeamPicker(false);
  };

  const removePreferredTeam = (teamId: string) => {
    const next = preferredTeams.filter((t) => t.id !== teamId);
    setPreferredTeams(next);
    savePreferredTeams(next);
  };

  const savePreferredTeams = async (teams: Team[]) => {
    setPreferredSaving(true);
    try {
      const res = await fetch("/api/account/preferred-teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIds: teams.map((t) => t.id) }),
      });
      const data = await res.json();
      if (res.ok) setPreferredTeams(data.teams || []);
    } finally {
      setPreferredSaving(false);
    }
  };

  const shippedOrders = orders.filter((o) => o.status === "shipped" || o.status === "delivered");
  const activeReturns = returns.length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        <p className="mt-4 text-gray-500">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Overview of your account and orders</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/orders"
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
        >
          <Package className="h-8 w-8 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          <p className="text-sm text-gray-500">Orders</p>
        </Link>
        <Link
          href="/wishlist"
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
        >
          <Heart className="h-8 w-8 text-rose-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{wishlistCount}</p>
          <p className="text-sm text-gray-500">Wishlist</p>
        </Link>
        <Link
          href="/account/addresses"
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
        >
          <MapPin className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{addressCount}</p>
          <p className="text-sm text-gray-500">Addresses</p>
        </Link>
        <Link
          href="/returns"
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
        >
          <ArrowLeftRight className="h-8 w-8 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{activeReturns}</p>
          <p className="text-sm text-gray-500">Returns</p>
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
            >
              <div className={`p-2 rounded-lg ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-gray-900">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Order tracking */}
      {shippedOrders.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Track orders</h2>
                <p className="text-sm text-gray-500">Shipped orders with tracking</p>
              </div>
            </div>
            <Link href="/orders" className="text-sm font-medium text-red-600 hover:text-red-700">
              View all
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {shippedOrders.slice(0, 3).map((order) => {
              const trackUrl = order.trackingNumber
                ? getTrackingUrl(order.trackingCarrier, order.trackingNumber)
                : null;
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50/50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    {order.trackingNumber && (
                      <p className="text-sm text-gray-600 mt-1 font-mono">{order.trackingNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/order/${order.orderNumber}`}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Details
                    </Link>
                    {trackUrl && (
                      <a
                        href={trackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Track <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent orders</h2>
              <p className="text-sm text-gray-500">View and track your orders</p>
            </div>
          </div>
          <Link href="/orders" className="text-sm font-medium text-red-600 hover:text-red-700">
            View all
          </Link>
        </div>
        <div className="p-6">
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No orders yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Start shopping to see your orders here</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                <ShoppingBag className="h-4 w-4" /> Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href={`/order/${order.orderNumber}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <span
                      className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <ChevronRight className="h-5 w-5 text-gray-400 inline-block mt-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Preferred teams */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <Star className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Teams I follow</h2>
              <p className="text-sm text-gray-500">News and updates for your favorites</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadAllTeamsForPicker}
            disabled={teamsLoading}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            {teamsLoading ? "Loading…" : "Add team"}
          </button>
        </div>
        <div className="p-6">
          {preferredTeams.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No teams selected yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Add your favorite teams to stay updated</p>
              <button
                type="button"
                onClick={loadAllTeamsForPicker}
                disabled={teamsLoading}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Choose teams
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {preferredTeams.map((team) => (
                <div
                  key={team.id}
                  className="group flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-red-200"
                >
                  <Avatar src={team.logoUrl} fallback={team.name} size="sm" />
                  <Link href={`/teams/${team.slug}`} className="font-medium text-gray-900 hover:text-red-600">
                    {team.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removePreferredTeam(team.id)}
                    disabled={preferredSaving}
                    className="ml-1 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                    aria-label={`Remove ${team.name}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team picker modal */}
      {showTeamPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowTeamPicker(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold">Add a team to follow</h3>
              <p className="text-sm text-gray-500 mt-0.5">Select from the list below</p>
            </div>
            <div className="overflow-y-auto max-h-80 p-4 space-y-2">
              {allTeams.filter((t) => !preferredTeams.some((p) => p.id === t.id)).length === 0 ? (
                <p className="text-gray-500 text-center py-8">You&apos;re following all available teams</p>
              ) : (
                allTeams
                  .filter((t) => !preferredTeams.some((p) => p.id === t.id))
                  .map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => addPreferredTeam(team)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50/50 text-left"
                    >
                      <Avatar src={team.logoUrl} fallback={team.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{team.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{team.sportType}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    </button>
                  ))
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowTeamPicker(false)}
                className="w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
