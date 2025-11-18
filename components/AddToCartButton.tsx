"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import LoadingSpinner from "./LoadingSpinner";
import { ShoppingCart, Check } from "lucide-react";

interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
}

interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
}

export default function AddToCartButton({
  product,
  disabled = false,
}: AddToCartButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes[0] || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors[0] || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (disabled || product.stock === 0) {
      return;
    }

    setIsAdding(true);

    // Add to local cart store
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });

    // Also sync with server cart if user is logged in
    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          size: selectedSize || null,
          color: selectedColor || null,
        }),
      });
    } catch (error) {
      console.error("Error syncing cart:", error);
    }

    setIsAdding(false);
    setShowSuccess(true);
    showToast("Item added to cart!", "success");
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="space-y-4">
      {product.sizes.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Size</label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  selectedSize === size
                    ? "border-red-600 bg-red-50 text-red-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {product.colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-4 py-2 border rounded-lg transition-colors capitalize ${
                  selectedColor === color
                    ? "border-red-600 bg-red-50 text-red-600"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="block text-sm font-medium">Quantity</label>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-gray-100"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
          <button
            onClick={() =>
              setQuantity(Math.min(product.stock, quantity + 1))
            }
            className="px-3 py-2 hover:bg-gray-100"
            disabled={quantity >= product.stock}
          >
            +
          </button>
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={disabled || product.stock === 0 || isAdding || showSuccess}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isAdding ? (
          <>
            <LoadingSpinner size="sm" />
            Adding...
          </>
        ) : showSuccess ? (
          <>
            <Check className="h-5 w-5" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </>
        )}
      </button>
    </div>
  );
}

