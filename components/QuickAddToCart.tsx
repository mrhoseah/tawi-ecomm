"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ShoppingCart, Check } from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  stock?: number;
}

interface QuickAddToCartProps {
  product: Product;
  variant?: "button" | "icon";
  className?: string;
}

export default function QuickAddToCart({
  product,
  variant = "button",
  className = "",
}: QuickAddToCartProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if ((product.stock ?? 0) === 0) {
      return;
    }

    setIsAdding(true);

    // Use first available size and color, or defaults
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    const color = product.colors && product.colors.length > 0 ? product.colors[0] : undefined;

    // Add to local cart store (works for both logged in and guest users)
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity: 1,
      size,
      color,
    });

    // Sync with server cart only if user is logged in
    if (session) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
            size: size || null,
            color: color || null,
          }),
        });
      } catch (error) {
        console.error("Error syncing cart:", error);
      }
    }

    setIsAdding(false);
    setShowSuccess(true);
    showToast("Item added to cart!", "success");
    setTimeout(() => setShowSuccess(false), 2000);
  };

  if (product.stock === 0) {
    return (
      <span className="text-xs text-gray-500">Out of Stock</span>
    );
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleQuickAdd}
        disabled={isAdding || showSuccess}
        className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all z-10 ${
          showSuccess
            ? "bg-green-500 text-white"
            : "bg-white hover:bg-red-600 hover:text-white"
        } ${isAdding ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        aria-label="Add to cart"
        title="Add to cart"
      >
        {showSuccess ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleQuickAdd}
      disabled={isAdding || showSuccess}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
        showSuccess
          ? "bg-green-500 text-white"
          : "bg-red-600 text-white hover:bg-red-700"
      } ${isAdding ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {isAdding ? (
        <>
          <LoadingSpinner size="sm" />
          <span>Adding...</span>
        </>
      ) : showSuccess ? (
        <>
          <Check className="h-4 w-4" />
          <span>Added!</span>
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          <span>Add to Cart</span>
        </>
      )}
    </button>
  );
}

