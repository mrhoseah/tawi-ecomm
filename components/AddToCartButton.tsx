"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import LoadingSpinner from "./LoadingSpinner";
import { ShoppingCart, Check, Shirt } from "lucide-react";
import { DEFAULT_PRINTING_COST } from "@/lib/constants";

interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  printable?: boolean;
  printingCost?: number | null;
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
  const [addPrinting, setAddPrinting] = useState(false);
  const [printedName, setPrintedName] = useState("");
  const [printedNumber, setPrintedNumber] = useState("");

  const printingCost =
    (product.printable &&
      (product.printingCost ?? DEFAULT_PRINTING_COST)) ||
    0;
  const unitPrice = product.price + (addPrinting ? printingCost : 0);

  const maxQuantity = product.stock > 0 ? product.stock : 10;

  const handleAddToCart = async () => {
    if (disabled) {
      return;
    }
    if (addPrinting && product.printable) {
      const nameTrim = printedName.trim();
      const numTrim = printedNumber.trim();
      if (!nameTrim) {
        showToast("Please enter a name for printing", "error");
        return;
      }
      if (nameTrim.length > 20) {
        showToast("Name must be 20 characters or less", "error");
        return;
      }
      if (numTrim && (numTrim.length > 2 || !/^\d+$/.test(numTrim))) {
        showToast("Number must be 1–2 digits (or leave empty)", "error");
        return;
      }
    }

    setIsAdding(true);

    const finalName = addPrinting ? printedName.trim().toUpperCase() : "";
    const finalNumber = addPrinting ? printedNumber.trim() : "";

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: unitPrice,
      image: product.images[0] || "",
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      printedName: finalName || undefined,
      printedNumber: finalNumber || undefined,
      printingCost: addPrinting ? printingCost : undefined,
    });

    try {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          size: selectedSize || null,
          color: selectedColor || null,
          printedName: finalName || null,
          printedNumber: finalNumber || null,
          printingCost: addPrinting ? printingCost : 0,
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

      {product.printable && (
        <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <Shirt className="h-5 w-5 text-red-600" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={addPrinting}
                  onChange={(e) => setAddPrinting(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-600 focus:ring-offset-0"
                />
                <span className="font-medium text-slate-900 group-hover:text-red-600 transition-colors">
                  Add custom name printing
                </span>
                <span className="text-red-600 font-semibold whitespace-nowrap">
                  +${printingCost.toFixed(2)}
                </span>
              </label>
              <p className="text-sm text-slate-500 mt-1 ml-7">
                Personalize this item with a printed name. Optional number for jerseys.
              </p>
              {addPrinting && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SMITH or John"
                      value={printedName}
                      onChange={(e) =>
                        setPrintedName(e.target.value.toUpperCase().slice(0, 20))
                      }
                      maxLength={20}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm uppercase placeholder:normal-case placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Number <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7"
                      value={printedNumber}
                      onChange={(e) =>
                        setPrintedNumber(e.target.value.replace(/\D/g, "").slice(0, 2))
                      }
                      maxLength={2}
                      className="w-20 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-center"
                    />
                  </div>
                </div>
              )}
            </div>
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
              setQuantity(Math.min(maxQuantity, quantity + 1))
            }
            className="px-3 py-2 hover:bg-gray-100"
            disabled={quantity >= maxQuantity}
          >
            +
          </button>
        </div>
      </div>

      {product.printable && addPrinting && (
        <p className="text-sm text-gray-600">
          Total:{" "}
          <span className="font-bold text-red-600">
            ${unitPrice.toFixed(2)}
          </span>{" "}
          <span className="text-gray-500">
            (base ${product.price.toFixed(2)} + printing ${printingCost.toFixed(2)})
          </span>
        </p>
      )}
      <button
        onClick={handleAddToCart}
        disabled={disabled || isAdding || showSuccess}
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

