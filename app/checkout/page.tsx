"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/lib/store";
import CouponInput from "@/components/CouponInput";
import Price from "@/components/Price";
import CheckoutSteps from "./CheckoutSteps";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";
import { CreditCard, Lock, Smartphone, Building2 } from "lucide-react";

const PayPalSection = dynamic(() => import("./PayPalSection"), { ssr: false });

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponFreeShipping, setCouponFreeShipping] = useState(false);
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [shippingMethods, setShippingMethods] = useState<{ id: string; name: string; cost: number; freeThreshold: number | null; estimatedDays: number | null; description: string | null }[]>([]);
  const [quoteMethods, setQuoteMethods] = useState<{ id: string; name: string; description: string | null; cost: number; isFree: boolean; estimatedDays: number | null }[]>([]);
  const [hasIneligibleProducts, setHasIneligibleProducts] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const { showToast } = useToast();

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: session?.user?.email || "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Kenya",
  });

  const [hasPrefilledShipping, setHasPrefilledShipping] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [bankDetails, setBankDetails] = useState<{
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
      .then((data) => {
        if (data.bankName || data.accountNumber) {
          setBankDetails(data);
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = getTotal();
  const tax = (subtotal - discount) * 0.1;

  useEffect(() => {
    fetch("/api/shipping-methods")
      .then((res) => res.json())
      .then((data) => {
        if (data.methods?.length) {
          setShippingMethods(data.methods);
          setShippingMethod(data.methods[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Prefill shipping info from user's default address (if available)
  useEffect(() => {
    if (!session?.user || hasPrefilledShipping) return;

    fetch("/api/addresses")
      .then((res) => res.json())
      .then((data) => {
        const addresses = (data.addresses || []) as Array<{
          type: string;
          isDefault: boolean;
          firstName: string;
          lastName: string;
          address1: string;
          address2?: string | null;
          city: string;
          state?: string | null;
          postalCode: string;
          country: string;
          phone?: string | null;
        }>;

        if (!addresses.length) return;

        const shippingAddress =
          addresses.find((a) => a.type === "shipping" && a.isDefault) ??
          addresses.find((a) => a.type === "shipping") ??
          addresses[0];

        if (!shippingAddress) return;

        setShippingInfo((prev) => ({
          ...prev,
          firstName: shippingAddress.firstName || prev.firstName,
          lastName: shippingAddress.lastName || prev.lastName,
          phone: shippingAddress.phone || prev.phone,
          address1: shippingAddress.address1 || prev.address1,
          address2: shippingAddress.address2 || prev.address2,
          city: shippingAddress.city || prev.city,
          state: shippingAddress.state || prev.state,
          postalCode: shippingAddress.postalCode || prev.postalCode,
          country: shippingAddress.country || prev.country,
        }));

        setHasPrefilledShipping(true);
      })
      .catch(() => {
        // Ignore address prefill failures; user can still enter details manually
      });
  }, [session?.user, hasPrefilledShipping]);

  // Fallback: prefill from session profile if no address prefill occurred
  useEffect(() => {
    if (!session?.user || hasPrefilledShipping) return;

    const fullName = session.user.name || "";
    const [firstNameFromName, ...restName] = fullName.split(" ").filter(Boolean);
    const lastNameFromName = restName.join(" ");
    const phoneFromSession = (session.user as any).phone as string | undefined;

    setShippingInfo((prev) => ({
      ...prev,
      firstName: prev.firstName || firstNameFromName || "",
      lastName: prev.lastName || lastNameFromName || "",
      email: prev.email || session.user?.email || "",
      phone: prev.phone || phoneFromSession || "",
    }));
  }, [session?.user, hasPrefilledShipping]);

  // Reduce input for M-Pesa by defaulting phone number from shipping info
  useEffect(() => {
    if (!mpesaPhone && shippingInfo.phone) {
      setMpesaPhone(shippingInfo.phone);
    }
  }, [shippingInfo.phone, mpesaPhone]);

  useEffect(() => {
    if (items.length === 0) return;
    setQuoteLoading(true);
    fetch("/api/shipping-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        subtotal,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.methods?.length) {
          setQuoteMethods(data.methods);
          setHasIneligibleProducts(data.hasIneligibleProducts ?? false);
          setShippingMethod((prev) =>
            data.methods.some((m: { id: string }) => m.id === prev) ? prev : data.methods[0].id
          );
        }
      })
      .catch(() => setQuoteMethods([]))
      .finally(() => setQuoteLoading(false));
  }, [items, subtotal]);

  const selectedQuote = quoteMethods.find((m) => m.id === shippingMethod);
  const fallbackMethod = shippingMethods.find((m) => m.id === shippingMethod);
  const getShippingCost = () => {
    if (couponFreeShipping) return 0;
    if (selectedQuote) return selectedQuote.cost;
    if (fallbackMethod) {
      const free = fallbackMethod.freeThreshold != null && !hasIneligibleProducts && subtotal >= fallbackMethod.freeThreshold;
      return free ? 0 : fallbackMethod.cost;
    }
    if (quoteMethods.length) return quoteMethods[0]?.cost ?? 10;
    if (shippingMethod === "standard" && !hasIneligibleProducts && subtotal >= 50) return 0;
    if (shippingMethod === "express") return 15;
    return 10;
  };
  const shipping = getShippingCost();
  const total = subtotal - discount + tax + shipping;

  const handleCouponApply = (code: string, discountAmount: number, freeShipping?: boolean) => {
    setAppliedCoupon(code);
    setDiscount(discountAmount);
    setCouponFreeShipping(!!freeShipping);
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponFreeShipping(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "paypal" && PAYPAL_CLIENT_ID) {
      if (!paypalOrderId) {
        setIsProcessing(true);
        try {
          const orderRes = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                color: item.color,
                printedName: item.printedName || null,
                printedNumber: item.printedNumber || null,
                printingCost: item.printingCost || 0,
              })),
              shippingAddress: shippingInfo,
              paymentMethod: "paypal",
              subtotal,
              discount,
              tax,
              shipping,
              total,
              shippingMethod,
              couponCode: appliedCoupon,
            }),
          });
          if (!orderRes.ok) {
            const err = await orderRes.json();
            showToast(err.error || "Failed to create order", "error");
            return;
          }
          const { order } = await orderRes.json();
          const payRes = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber: order.orderNumber, amount: total }),
          });
          if (!payRes.ok) throw new Error("Failed to create PayPal order");
          const { paypalOrderId: pid } = await payRes.json();
          setPaypalOrderId(pid);
          setPendingOrderNumber(order.orderNumber);
          showToast("Complete payment with PayPal below", "success");
        } catch (err) {
          showToast(err instanceof Error ? err.message : "Failed to create order", "error");
        } finally {
          setIsProcessing(false);
        }
      }
      return;
    }

    if (paymentMethod === "mpesa" && !mpesaPhone.trim()) {
      showToast("Please enter your M-Pesa phone number", "error");
      return;
    }

    if (paymentMethod === "bank" && (!bankDetails?.accountNumber || !bankDetails?.bankName)) {
      showToast("Bank transfer details are not configured. Please contact support or choose another payment method.", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
            printedName: item.printedName || null,
            printedNumber: item.printedNumber || null,
            printingCost: item.printingCost || 0,
          })),
          shippingAddress: shippingInfo,
          paymentMethod,
          subtotal,
          discount,
          tax,
          shipping,
          total,
          shippingMethod,
          couponCode: appliedCoupon,
        }),
      });

      if (response.ok) {
        const order = await response.json();

        if (paymentMethod === "mpesa") {
          const stkRes = await fetch("/api/mpesa/stk-push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: mpesaPhone.trim(),
              amount: total,
              orderNumber: order.orderNumber,
            }),
          });

          const stkData = await stkRes.json();
          if (stkRes.ok) {
            showToast("STK push sent. Complete payment on your phone.", "success");
          } else {
            showToast(stkData.error || "M-Pesa request failed. Order placed—please pay via bank.", "error");
          }
        }

        clearCart();
        router.push(`/order/${order.orderNumber}`);
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to place order. Please try again.", "error");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Require login only at checkout
  if (!session) {
    router.push("/sign-in?callbackUrl=/checkout");
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg mb-4">Please sign in to continue with checkout</p>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/cart");
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg mb-4">Your cart is empty</p>
            <Link
              href="/shop"
              className="text-red-600 hover:underline"
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
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>
          
          <CheckoutSteps currentStep={currentStep} />

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
                {session?.user && (
                  <p className="text-sm text-gray-600 mb-4">
                    We&apos;ve pre-filled your details from your account. Please confirm everything looks correct.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.firstName}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, firstName: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.lastName}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, lastName: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={shippingInfo.email}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, email: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingInfo.phone}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, phone: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.address1}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, address1: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Address 2
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.address2}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, address2: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.city}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, city: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.state}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, state: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.postalCode}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, postalCode: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.country}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, country: e.target.value })
                      }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
                {hasIneligibleProducts && (
                  <p className="text-amber-700 text-sm mb-4 p-3 bg-amber-50 rounded-lg">
                    Some items in your cart do not qualify for free shipping. Shipping fees apply.
                  </p>
                )}
                {quoteLoading && quoteMethods.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500 py-4">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    Calculating shipping...
                  </div>
                ) : (
                <div className="space-y-3">
                  {quoteMethods.length > 0 ? (
                    quoteMethods.map((qm) => (
                      <label key={qm.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="shipping"
                            value={qm.id}
                            checked={shippingMethod === qm.id}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">{qm.name}</span>
                            <p className="text-sm text-gray-600">
                              {qm.description || (qm.estimatedDays ? `${qm.estimatedDays} business days` : "")}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold">
                          {qm.isFree ? "Free" : <Price amount={qm.cost} />}
                        </span>
                      </label>
                    ))
                  ) : shippingMethods.length > 0 ? (
                    shippingMethods.map((m) => {
                      const cost = m.freeThreshold != null && !hasIneligibleProducts && subtotal >= m.freeThreshold ? 0 : m.cost;
                      return (
                        <label key={m.id} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="shipping"
                              value={m.id}
                              checked={shippingMethod === m.id}
                              onChange={(e) => setShippingMethod(e.target.value)}
                              className="mr-3"
                            />
                            <div>
                              <span className="font-medium">{m.name}</span>
                              <p className="text-sm text-gray-600">
                                {m.description || (m.estimatedDays ? `${m.estimatedDays} business days` : "")}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {cost === 0 ? "Free" : <Price amount={cost} />}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <>
                      <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="shipping"
                            value="standard"
                            checked={shippingMethod === "standard"}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">Standard Shipping</span>
                            <p className="text-sm text-gray-600">5-7 business days</p>
                          </div>
                        </div>
                        <span className="font-semibold">{subtotal > 50 || couponFreeShipping ? "Free" : <Price amount={10} />}</span>
                      </label>
                      <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="shipping"
                            value="express"
                            checked={shippingMethod === "express"}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">Express Shipping</span>
                            <p className="text-sm text-gray-600">2-3 business days</p>
                          </div>
                        </div>
                        <span className="font-semibold">{couponFreeShipping ? "Free" : <Price amount={15} />}</span>
                      </label>
                    </>
                  )}
                </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="mpesa"
                      checked={paymentMethod === "mpesa"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <Smartphone className="h-5 w-5 mr-2 text-green-600" />
                    <span>M-Pesa</span>
                  </label>
                  {paymentMethod === "mpesa" && (
                    <div className="ml-8 p-4 bg-green-50 rounded-lg">
                      <label className="block text-sm font-medium mb-2">M-Pesa phone number</label>
                      <input
                        type="tel"
                        placeholder="07XX XXX XXX or 2547XX XXX XXX"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        You will receive an M-Pesa prompt on this number to complete payment.
                      </p>
                    </div>
                  )}

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Bank Transfer</span>
                  </label>
                  {paymentMethod === "bank" && (
                    <div className="ml-8 p-4 bg-blue-50 rounded-lg">
                      {bankDetails?.accountNumber ? (
                        <div className="text-sm text-gray-700 space-y-2">
                          <p><strong>Bank:</strong> {bankDetails.bankName}</p>
                          <p><strong>Account Name:</strong> {bankDetails.accountName}</p>
                          <p><strong>Account Number:</strong> {bankDetails.accountNumber}</p>
                          {bankDetails.branchName && <p><strong>Branch:</strong> {bankDetails.branchName}</p>}
                          {bankDetails.swiftCode && <p><strong>SWIFT:</strong> {bankDetails.swiftCode}</p>}
                          {bankDetails.bankCode && <p><strong>Bank Code:</strong> {bankDetails.bankCode}</p>}
                          {bankDetails.instructions && (
                            <p className="mt-2 text-gray-600 whitespace-pre-wrap">{bankDetails.instructions}</p>
                          )}
                          <p className="font-semibold mt-2">Use your order number as the reference when transferring.</p>
                        </div>
                      ) : (
                        <p className="text-sm text-amber-700">
                          Bank details not configured. Admin: add details in Settings.
                        </p>
                      )}
                    </div>
                  )}

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <Lock className="h-5 w-5 mr-2" />
                    <span>Cash on Delivery</span>
                  </label>

                  {PAYPAL_CLIENT_ID && (
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={paymentMethod === "paypal"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setPaypalOrderId(null);
                          setPendingOrderNumber(null);
                        }}
                        className="mr-3"
                      />
                      <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                      <span>PayPal</span>
                    </label>
                  )}
                  {paymentMethod === "paypal" &&
                    paypalOrderId &&
                    pendingOrderNumber &&
                    PAYPAL_CLIENT_ID && (
                      <div className="ml-8 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium mb-3">
                          Complete payment with PayPal
                        </p>
                        <PayPalSection
                          paypalOrderId={paypalOrderId}
                          pendingOrderNumber={pendingOrderNumber}
                          total={total}
                          setIsProcessing={setIsProcessing}
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                {/* Coupon Input */}
                <div className="mb-4">
                  <CouponInput
                    onApply={handleCouponApply}
                    appliedCoupon={appliedCoupon}
                    onRemove={handleCouponRemove}
                    subtotal={subtotal}
                    userId={session?.user?.id ?? null}
                  />
                </div>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name}
                        {(item.printedName || item.printedNumber) && (
                          <span className="block text-xs text-gray-500">
                            {[item.printedName, item.printedNumber && `#${item.printedNumber}`].filter(Boolean).join(" ")}
                          </span>
                        )}{" "}
                        x{item.quantity}
                      </span>
                      <span><Price amount={item.price * item.quantity} /></span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span><Price amount={subtotal} /></span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-<Price amount={discount} /></span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span><Price amount={tax} /></span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <Price amount={shipping} />
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span><Price amount={total} /></span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-6 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing && <LoadingSpinner size="sm" />}
                  {isProcessing ? "Processing..." : "Place Order"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

