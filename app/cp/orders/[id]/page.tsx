"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  Home,
  ExternalLink,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getTrackingUrl } from "@/lib/tracking";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  printedName?: string | null;
  printedNumber?: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: any;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  shippedAt?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminOrderDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: "",
    paymentStatus: "",
    trackingNumber: "",
    trackingCarrier: "",
  });

  useEffect(() => {
    if (!session) return;
    const role = (session.user as { role?: string })?.role;
    const isAdmin = role === "admin" || role === "support";
    if (!isAdmin) {
      router.push("/cp");
      return;
    }
    fetch(`/api/admin/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.order) {
          router.push("/cp/orders");
          return;
        }
        setOrder(data.order);
        setForm({
          status: data.order.status,
          paymentStatus: data.order.paymentStatus,
          trackingNumber: data.order.trackingNumber || "",
          trackingCarrier: data.order.trackingCarrier || "",
        });
      })
      .finally(() => setLoading(false));
  }, [session, id, router]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status || undefined,
          paymentStatus: form.paymentStatus || undefined,
          trackingNumber: form.trackingNumber || undefined,
          trackingCarrier: form.trackingCarrier || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order");
      if (data.order) {
        setOrder(data.order);
        setForm({
          status: data.order.status,
          paymentStatus: data.order.paymentStatus,
          trackingNumber: data.order.trackingNumber || "",
          trackingCarrier: data.order.trackingCarrier || "",
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

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

  if (!session || loading) {
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

  if (!order) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Link
                href="/cp/orders"
                className="text-red-600 hover:underline flex items-center gap-2 mb-3 text-sm"
              >
                <Home className="h-4 w-4" />
                Back to Orders
              </Link>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                Order #{order.orderNumber}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{order.status}</span>
                </span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 pb-4 border-b last:border-0"
                    >
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
                      >
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="font-semibold hover:text-red-600 transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                          <div>
                            Qty: {item.quantity} ·{" "}
                            <span className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          {item.size && <div>Size: {item.size}</div>}
                          {item.color && <div>Color: {item.color}</div>}
                          {(item.printedName || item.printedNumber) && (
                            <div className="text-red-600 font-medium">
                              {[item.printedName, item.printedNumber && `#${item.printedNumber}`]
                                .filter(Boolean)
                                .join(" ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Shipping & Tracking
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 text-sm text-gray-700">
                      Shipping Address
                    </h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-semibold">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                      </p>
                      <p>{order.shippingAddress.address1}</p>
                      {order.shippingAddress.address2 && (
                        <p>{order.shippingAddress.address2}</p>
                      )}
                      <p>
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state}{" "}
                        {order.shippingAddress.postalCode}
                      </p>
                      <p>{order.shippingAddress.country}</p>
                      {order.shippingAddress.phone && (
                        <p>Phone: {order.shippingAddress.phone}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-sm text-gray-700">
                      Admin Controls
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Order Status
                        </label>
                        <select
                          value={form.status}
                          onChange={(e) =>
                            setForm({ ...form, status: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Payment Status
                        </label>
                        <select
                          value={form.paymentStatus}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              paymentStatus: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          value={form.trackingNumber}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              trackingNumber: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder="e.g. 1Z999AA10123456784"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Carrier
                        </label>
                        <select
                          value={form.trackingCarrier}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              trackingCarrier: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="">—</option>
                          <option value="DHL">DHL</option>
                          <option value="FedEx">FedEx</option>
                          <option value="UPS">UPS</option>
                          <option value="USPS">USPS</option>
                          <option value="Royal Mail">Royal Mail</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </div>
                </div>
                {order.trackingNumber && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                      Tracking Details
                    </h3>
                    {order.trackingCarrier && (
                      <p className="text-xs text-gray-600 mb-1">
                        Carrier: {order.trackingCarrier}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 mb-2">
                      Tracking Number:{" "}
                      <span className="font-mono font-semibold">
                        {order.trackingNumber}
                      </span>
                    </p>
                    {(() => {
                      const url = getTrackingUrl(
                        order.trackingCarrier,
                        order.trackingNumber!
                      );
                      return url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-xs"
                        >
                          Open tracking page
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20 space-y-3">
                <h2 className="text-lg font-semibold">Order Summary</h2>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- ${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {order.shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `$${order.shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {order.shippingMethod && (
                    <div className="text-xs text-gray-500">
                      Method: {order.shippingMethod}
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-3 border-t text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-medium capitalize">
                      {order.paymentMethod || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status</span>
                    <span className="font-medium capitalize">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

