"use client";

import { useState, useEffect } from "react";
import { X, ShoppingCart } from "lucide-react";
import QuickAddToCart from "./QuickAddToCart";
import Price from "./Price";
import Link from "next/link";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  description?: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  stock?: number;
  category: string;
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      setSelectedImage(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b flex justify-between items-center p-4 z-10">
          <h2 className="text-xl font-bold">Quick View</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index
                        ? "border-red-600"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-2">
              <span className="text-sm text-gray-500 uppercase tracking-wide">
                {product.category}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4">{product.name}</h3>

            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Price
                amount={product.price}
                compareAt={product.compareAtPrice}
                showCompare
                className="text-3xl font-bold"
              />
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                  Save <Price amount={product.compareAtPrice - product.price} />
                </span>
              )}
            </div>

            {product.description && (
              <div className="mb-4">
                <p className="text-gray-700 line-clamp-3">{product.description}</p>
              </div>
            )}

            <div className="mb-6">
              <QuickAddToCart product={product} variant="button" className="w-full" />
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <span className="font-medium w-24">Availability:</span>
                <span
                  className={(product.stock ?? 0) > 0 ? "text-green-600" : "text-red-600"}
                >
                  {(product.stock ?? 0) > 0
                    ? `In Stock (${product.stock} available)`
                    : "Out of Stock"}
                </span>
              </div>
              {product.sizes && product.sizes.length > 0 && (
                <div className="flex items-center">
                  <span className="font-medium w-24">Sizes:</span>
                  <span>{product.sizes.join(", ")}</span>
                </div>
              )}
              {product.colors && product.colors.length > 0 && (
                <div className="flex items-center">
                  <span className="font-medium w-24">Colors:</span>
                  <span>{product.colors.join(", ")}</span>
                </div>
              )}
            </div>

            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="block text-center text-red-600 hover:text-red-700 font-semibold"
            >
              View Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

