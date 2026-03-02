"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { Package, CheckCircle, Clock, Truck, Home, Building2, ExternalLink } from "lucide-react";
import { getTrackingUrl } from "@/lib/tracking";

function BankDetailsCard({ orderNumber }: { orderNumber: string }) {
  const [details, setDetails] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName: string;
    swiftCode: string;
    bankCode: string;
    instructions: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then(setDetails)
      .catch(() => {});
  }, []);

  if (!details?.accountNumber) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
      <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-blue-600" />
        Bank Transfer Details
      </h3>
      <div className="text-sm text-gray-700 space-y-1">
        <p><strong>Bank:</strong> {details.bankName}</p>
        <p><strong>Account Name:</strong> {details.accountName}</p>
        <p><strong>Account Number:</strong> {details.accountNumber}</p>
        {details.branchName && <p><strong>Branch:</strong> {details.branchName}</p>}
        {details.swiftCode && <p><strong>SWIFT:</strong> {details.swiftCode}</p>}
        <p className="mt-2 text-red-600 font-medium">
          Use <strong>{orderNumber}</strong> as the reference when transferring.
        </p>
        {details.instructions && (
          <p className="mt-2 text-gray-600 whitespace-pre-wrap">{details.instructions}</p>
        )}
      </div>
    </div>
  );
}

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

export default function OrderPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({
    status: "",
    paymentStatus: "",
    trackingNumber: "",
    trackingCarrier: "",
  });

  useEffect(() => {
    if (!session) {
      router.push("/sign-in");
      return;
    }

    fetch(`/api/orders/${orderNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          router.push("/orders");
          return;
        }
        setOrder(data.order);
        if (data.order) {
          setAdminForm({
            status: data.order.status,
            paymentStatus: data.order.paymentStatus,
            trackingNumber: data.order.trackingNumber || "",
            trackingCarrier: data.order.trackingCarrier || "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/orders");
      });
  }, [session, orderNumber, router]);

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

  if (!order) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "shipped":
        return <Truck className="h-6 w-6 text-blue-600" />;
      case "processing":
        return <Package className="h-6 w-6 text-yellow-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-600" />;
    }
  };

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "admin" || role === "support";

  const handleAdminSave = async () => {
    if (!order?.id || !isAdmin) return;
    setAdminSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: adminForm.status || undefined,
          paymentStatus: adminForm.paymentStatus || undefined,
          trackingNumber: adminForm.trackingNumber || undefined,
          trackingCarrier: adminForm.trackingCarrier || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (data.order) {
        setOrder((o) => (o ? { ...o, ...data.order } : null));
        setAdminForm({
          status: data.order.status,
          paymentStatus: data.order.paymentStatus,
          trackingNumber: data.order.trackingNumber || "",
          trackingCarrier: data.order.trackingCarrier || "",
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setAdminSaving(false);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/orders"
              className="text-red-600 hover:underline flex items-center gap-2 mb-4"
            >
              <Home className="h-4 w-4" />
              Back to Orders
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-gray-600">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusIcon(order.status)}
                <span className="font-semibold capitalize">{order.status}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Order Items</h2>
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
                        <div className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity}
                          {item.size && ` • Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                          {(item.printedName || item.printedNumber) && (
                            <span className="block text-red-600 font-medium mt-0.5">
                              {[item.printedName, item.printedNumber && `#${item.printedNumber}`].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold mt-2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                {order.status === "delivered" && (
                  <div className="mt-2">
                    <Link
                      href={`/product/${item.product.slug}?review=1`}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Write a review
                    </Link>
                  </div>
                )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                <div className="text-gray-700">
                  <p className="font-semibold">
                    {order.shippingAddress.firstName}{" "}
                    {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && (
                    <p>{order.shippingAddress.address2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                  )}
                </div>
              </div>

              {/* Order Tracking Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Order Tracking</h2>
                <div className="space-y-4">
                  {/* Timeline */}
                  <div className="relative pl-8 border-l-2 border-gray-200 space-y-6">
                    {[
                      { key: "placed", label: "Order Placed", icon: Clock, date: order.createdAt, done: true },
                      { key: "processing", label: "Processing", icon: Package, date: null, done: ["processing", "shipped", "delivered"].includes(order.status) },
                      { key: "shipped", label: "Shipped", icon: Truck, date: order.shippedAt ?? null, done: ["shipped", "delivered"].includes(order.status) },
                      { key: "delivered", label: "Delivered", icon: CheckCircle, date: null, done: order.status === "delivered" },
                    ].map((step) => {
                      const Icon = step.icon;
                      const isDone = step.done;
                      const isCurrent =
                        (step.key === "placed" && order.status === "pending") ||
                        (step.key === "processing" && order.status === "processing") ||
                        (step.key === "shipped" && order.status === "shipped") ||
                        (step.key === "delivered" && order.status === "delivered");
                      return (
                        <div key={step.key} className="relative -ml-8 flex items-start gap-3">
                          <div
                            className={`absolute left-0 flex-shrink-0 w-6 h-6 -ml-[15px] rounded-full border-2 border-white shadow-sm ${
                              isDone ? "bg-green-500" : isCurrent ? "bg-blue-500 ring-2 ring-blue-200" : "bg-gray-300"
                            }`}
                          />
                          <div className="flex-1 pl-4">
                            <p className={`font-medium ${isDone ? "text-gray-900" : isCurrent ? "text-blue-600" : "text-gray-500"}`}>
                              {step.label}
                            </p>
                            {step.date && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {new Date(step.date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isAdmin && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Admin: Update Order</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Status</label>
                          <select
                            value={adminForm.status}
                            onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value })}
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
                          <label className="block text-sm font-medium mb-1">Payment Status</label>
                          <select
                            value={adminForm.paymentStatus}
                            onChange={(e) => setAdminForm({ ...adminForm, paymentStatus: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Tracking Number</label>
                          <input
                            type="text"
                            value={adminForm.trackingNumber}
                            onChange={(e) => setAdminForm({ ...adminForm, trackingNumber: e.target.value })}
                            placeholder="e.g. 1Z999AA10123456784"
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Carrier</label>
                          <select
                            value={adminForm.trackingCarrier}
                            onChange={(e) => setAdminForm({ ...adminForm, trackingCarrier: e.target.value })}
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
                      </div>
                      <button
                        type="button"
                        onClick={handleAdminSave}
                        disabled={adminSaving}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {adminSaving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  )}

                  {order.trackingNumber && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-2">Tracking Details</h3>
                      {order.trackingCarrier && (
                        <p className="text-sm text-gray-600 mb-1">Carrier: {order.trackingCarrier}</p>
                      )}
                      <p className="text-gray-700 mb-2">
                        Tracking Number:{" "}
                        <span className="font-mono font-semibold">{order.trackingNumber}</span>
                      </p>
                      {(() => {
                        const url = getTrackingUrl(order.trackingCarrier, order.trackingNumber!);
                        return url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Track your package <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
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
                    <div className="text-sm text-gray-500">
                      Method: {order.shippingMethod}
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600 mb-2">
                    Payment Method
                  </div>
                  <div className="font-semibold capitalize">
                    {order.paymentMethod === "mpesa"
                      ? "M-Pesa"
                      : order.paymentMethod === "bank"
                      ? "Bank Transfer"
                      : order.paymentMethod || "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Payment Status:{" "}
                    <span className="capitalize">{order.paymentStatus}</span>
                  </div>
                  {order.paymentMethod === "bank" && (
                    <BankDetailsCard orderNumber={order.orderNumber} />
                  )}
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
