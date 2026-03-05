"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { Package, CheckCircle, Clock, Truck } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  total: number;
  createdAt: string;
  items: Array<{
    quantity: number;
    product: {
      name: string;
      images: string[];
    };
  }>;
}

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/sign-in?callbackUrl=/orders");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  if (status === "loading" || loading) {
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

  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg mb-4">Please sign in to view your orders</p>
            <p className="text-gray-600">Redirecting…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "processing":
        return <Package className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const visibleOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "completed") return order.status === "delivered";
    if (statusFilter === "cancelled") return order.status === "cancelled";
    return order.status !== "delivered" && order.status !== "cancelled";
  });

  const getPaymentLabel = (order: Order) => {
    if (order.paymentStatus === "paid") return "Paid";
    if (order.paymentStatus === "pending") {
      if (order.paymentMethod === "bank") return "Awaiting bank transfer";
      if (order.paymentMethod === "mpesa") return "Awaiting M‑Pesa confirmation";
      return "Payment pending";
    }
    if (order.paymentStatus === "failed") return "Payment failed";
    if (order.paymentStatus === "refunded") return "Refunded";
    return order.paymentStatus;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold">My Orders</h1>
            {orders.length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-full ${
                    statusFilter === "all"
                      ? "bg-white shadow-sm font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-3 py-1 rounded-full ${
                    statusFilter === "active"
                      ? "bg-white shadow-sm font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1 rounded-full ${
                    statusFilter === "completed"
                      ? "bg-white shadow-sm font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-3 py-1 rounded-full ${
                    statusFilter === "cancelled"
                      ? "bg-white shadow-sm font-semibold"
                      : "text-gray-600"
                  }`}
                >
                  Cancelled
                </button>
              </div>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
              <p className="text-gray-600 mb-8">
                Start shopping to see your orders here.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <p className="font-medium mb-2">
                No {statusFilter === "active" ? "active" : statusFilter} orders.
              </p>
              <p className="text-sm">
                Try a different filter or{" "}
                <Link
                  href="/shop"
                  className="text-red-600 hover:underline font-medium"
                >
                  continue shopping
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/order/${order.orderNumber}`}
                  className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {order.items[0]?.product.images[0] && (
                        <img
                          src={order.items[0].product.images[0]}
                          alt={order.items[0].product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            Order #{order.orderNumber}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""} •{" "}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.items[0]?.product.name}
                          {order.items.length > 1 &&
                            ` and ${order.items.length - 1} more`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        ${order.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {getPaymentLabel(order)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

