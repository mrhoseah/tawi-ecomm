"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import { Package, ArrowLeftRight, LogIn } from "lucide-react";

interface OrderItem {
  productId: string;
  product: { name: string; images: string[] };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderReturn {
  orderId: string;
  order: { orderNumber: string };
}

export default function ReturnsPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/order-returns").then((r) => r.json()),
    ])
      .then(([ordersData, returnsData]) => {
        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setReturns(Array.isArray(returnsData) ? returnsData : []);
      })
      .catch(() => {
        setOrders([]);
        setReturns([]);
      })
      .finally(() => setLoading(false));
  }, [status]);

  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const returnedOrderIds = new Set(returns.map((r) => r.orderId));
  const eligibleOrders = deliveredOrders.filter(
    (o) => !returnedOrderIds.has(o.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !reason.trim()) {
      showToast("Please select an order and provide a reason", "error");
      return;
    }
    setSubmitting(selectedOrder);
    try {
      const res = await fetch("/api/order-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast("Return request submitted successfully.", "success");
      setReturns((prev) => [...prev, { orderId: selectedOrder, order: { orderNumber: orders.find((o) => o.id === selectedOrder)?.orderNumber ?? "" } }]);
      setSelectedOrder(null);
      setReason("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong", "error");
    } finally {
      setSubmitting(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <LoadingSpinner />
        </main>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Order Returns
            </h1>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-12">
              <LogIn className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <p className="text-gray-600 mb-8">
                Please sign in to view your delivered orders and request returns.
              </p>
              <Link
                href="/sign-in?callbackUrl=/returns"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                Sign In
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Order Returns
          </h1>
          <p className="text-center text-gray-600 mb-12">
            Request a return for delivered orders.
          </p>

          {eligibleOrders.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <p className="text-gray-600 mb-4">
                {deliveredOrders.length === 0
                  ? "You have no delivered orders eligible for return."
                  : "All your delivered orders have return requests pending or completed."}
              </p>
              <Link
                href="/orders"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                View your orders
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                {eligibleOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()} · $
                          {order.total.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order.id);
                          setReason("");
                        }}
                        disabled={!!submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        Request Return
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrder && (
                <form
                  onSubmit={handleSubmit}
                  className="border border-gray-200 rounded-lg bg-white p-6 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Return reason
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Order {eligibleOrders.find((o) => o.id === selectedOrder)?.orderNumber}
                  </p>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    rows={4}
                    placeholder="Describe why you are requesting a return..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(null);
                        setReason("");
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!!submitting}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium inline-flex items-center gap-2"
                    >
                      {submitting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <ArrowLeftRight className="h-4 w-4" />
                      )}
                      Submit Return Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
