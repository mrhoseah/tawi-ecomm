"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCartStore } from "@/lib/store";
import { Minus, Plus, Trash2, ShoppingBag, Heart } from "lucide-react";
import Link from "next/link";
import { saveForLater, removeFromSaveForLater, getSaveForLater } from "@/lib/saveForLater";
import CouponInput from "@/components/CouponInput";
import Price from "@/components/Price";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/components/Toast";

export default function CartPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, clearCart, addItem } =
    useCartStore();
  const [isLoading, setIsLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [couponFreeShipping, setCouponFreeShipping] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Load cart from server if user is logged in and merge with local cart
    if (session) {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.items && data.items.length > 0) {
            // Merge server cart with local cart
            // For now, we'll keep local cart as primary since it's more up-to-date
            // In production, you might want more sophisticated merging logic
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      // Guest users can view cart from localStorage
      setIsLoading(false);
    }

    // Load saved for later items
    setSavedItems(getSaveForLater());
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Start adding items to your cart to see them here.
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

  const subtotal = getTotal();
  const tax = (subtotal - discount) * 0.1; // 10% tax
  const baseShipping = subtotal > 50 ? 0 : 10;
  const shipping = couponFreeShipping ? 0 : baseShipping;
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm p-6 flex flex-col sm:flex-row gap-4"
                >
                  <Link
                    href={item.slug ? `/product/${item.slug}` : `/product/${item.productId}`}
                    className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 block"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </Link>

                  <div className="flex-1">
                    <Link
                      href={item.slug ? `/product/${item.slug}` : `/product/${item.productId}`}
                      className="block"
                    >
                      <h3 className="font-semibold text-lg mb-2 hover:text-red-600 transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                    {item.size && (
                      <p className="text-sm text-gray-600 mb-1">
                        Size: <span className="font-medium">{item.size}</span>
                      </p>
                    )}
                    {item.color && (
                      <p className="text-sm text-gray-600 mb-1">
                        Color: <span className="font-medium capitalize">{item.color}</span>
                      </p>
                    )}
                    {(item.printedName || item.printedNumber) && (
                      <p className="text-sm text-gray-600 mb-2">
                        Printing: <span className="font-medium">
                          {[item.printedName, item.printedNumber && `#${item.printedNumber}`].filter(Boolean).join(" ")}
                        </span>
                      </p>
                    )}
                    <div className="mb-4">
                      <p className="text-lg font-bold text-red-600">
                        <Price amount={item.price} /> each
                      </p>
                      <p className="text-sm text-gray-600">
                        Subtotal: <Price amount={item.price * item.quantity} />
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.size,
                              item.color,
                              item.printedName,
                              item.printedNumber
                            )
                          }
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-1 min-w-[50px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.size,
                              item.color,
                              item.printedName,
                              item.printedNumber
                            )
                          }
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                                    saveForLater({
                                      productId: item.productId,
                                      slug: item.slug || "",
                                      name: item.name,
                                      price: item.price,
                                      image: item.image,
                                      size: item.size,
                                      color: item.color,
                                      printedName: item.printedName,
                                      printedNumber: item.printedNumber,
                                      printingCost: item.printingCost,
                                    });
                                    removeItem(item.productId, item.size, item.color, item.printedName, item.printedNumber);
                                    setSavedItems(getSaveForLater());
                                    showToast("Item saved for later", "success");
                                  }}
                                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm transition-colors"
                                  title="Save for later"
                                >
                                  <Heart className="h-4 w-4" />
                                  Save
                                </button>
                        <button
                          onClick={() =>
                            removeItem(item.productId, item.size, item.color, item.printedName, item.printedNumber)
                          }
                          className="text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Saved for Later */}
              {savedItems.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Saved for Later</h2>
                  <div className="space-y-4">
                    {savedItems.map((savedItem, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4"
                      >
                        <Link
                          href={savedItem.slug ? `/product/${savedItem.slug}` : "#"}
                          className="w-full sm:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 block"
                        >
                          {savedItem.image ? (
                            <img
                              src={savedItem.image}
                              alt={savedItem.name}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </Link>
                        <div className="flex-1">
                          <Link
                            href={savedItem.slug ? `/product/${savedItem.slug}` : "#"}
                          >
                            <h3 className="font-semibold mb-1 hover:text-red-600 transition-colors">
                              {savedItem.name}
                            </h3>
                          </Link>
                          {savedItem.size && (
                            <p className="text-sm text-gray-600">Size: {savedItem.size}</p>
                          )}
                          {savedItem.color && (
                            <p className="text-sm text-gray-600">Color: {savedItem.color}</p>
                          )}
                          {(savedItem.printedName || savedItem.printedNumber) && (
                            <p className="text-sm text-gray-600">
                              Printing: {[savedItem.printedName, savedItem.printedNumber && `#${savedItem.printedNumber}`].filter(Boolean).join(" ")}
                            </p>
                          )}
                          <p className="text-lg font-bold text-red-600 mt-2">
                            <Price amount={savedItem.price} />
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              addItem({
                                productId: savedItem.productId,
                                slug: savedItem.slug,
                                name: savedItem.name,
                                price: savedItem.price,
                                image: savedItem.image,
                                quantity: 1,
                                size: savedItem.size,
                                color: savedItem.color,
                                printedName: savedItem.printedName,
                                printedNumber: savedItem.printedNumber,
                                printingCost: savedItem.printingCost,
                              });
                              removeFromSaveForLater(
                                savedItem.productId,
                                savedItem.size,
                                savedItem.color,
                                savedItem.printedName,
                                savedItem.printedNumber
                              );
                              setSavedItems(getSaveForLater());
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Move to Cart
                          </button>
                          <button
                            onClick={() => {
                              removeFromSaveForLater(
                                savedItem.productId,
                                savedItem.size,
                                savedItem.color,
                                savedItem.printedName,
                                savedItem.printedNumber
                              );
                              setSavedItems(getSaveForLater());
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

                <div className="space-y-3 mb-6">
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
                  {subtotal < 50 && (
                    <p className="text-sm text-gray-500">
                      Add <Price amount={50 - subtotal} /> more for free shipping
                    </p>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span><Price amount={total} /></span>
                  </div>
                </div>

                {session ? (
                  <Link
                    href="/checkout"
                    className="block w-full text-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Proceed to Checkout
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 text-center mb-2">
                      Sign in to checkout
                    </p>
                    <Link
                      href="/sign-in?callbackUrl=/checkout"
                      className="block w-full text-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      Sign In to Checkout
                    </Link>
                  </div>
                )}

                <Link
                  href="/shop"
                  className="block w-full text-center mt-4 text-gray-600 hover:text-red-600 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

