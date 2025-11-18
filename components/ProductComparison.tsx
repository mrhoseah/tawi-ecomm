"use client";

import { useState } from "react";
import { X, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import QuickAddToCart from "./QuickAddToCart";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  description: string;
  sizes?: string[];
  colors?: string[];
  stock: number;
  category: string;
}

interface ProductComparisonProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClose: () => void;
}

export default function ProductComparison({
  products,
  onRemove,
  onClose,
}: ProductComparisonProps) {
  if (products.length === 0) return null;

  const attributes = [
    { label: "Price", key: "price" },
    { label: "Category", key: "category" },
    { label: "Stock", key: "stock" },
    { label: "Sizes", key: "sizes" },
    { label: "Colors", key: "colors" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b flex justify-between items-center p-4 z-10">
          <h2 className="text-xl font-bold">Compare Products</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b">Product</th>
                  {products.map((product) => (
                    <th key={product.id} className="text-center p-4 border-b relative">
                      <button
                        onClick={() => onRemove(product.id)}
                        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="space-y-2">
                        <Link href={`/product/${product.slug}`}>
                          <img
                            src={product.images[0] || ""}
                            alt={product.name}
                            className="w-32 h-32 object-cover mx-auto rounded-lg"
                          />
                        </Link>
                        <Link
                          href={`/product/${product.slug}`}
                          className="block font-semibold hover:text-red-600"
                        >
                          {product.name}
                        </Link>
                        <QuickAddToCart
                          product={product}
                          variant="button"
                          className="w-full text-sm"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b font-medium">Price</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4 border-b text-center">
                      {product.compareAtPrice ? (
                        <div>
                          <span className="text-red-600 font-bold">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className="text-gray-400 line-through text-sm ml-2">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold">${product.price.toFixed(2)}</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Category</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4 border-b text-center capitalize">
                      {product.category}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 border-b font-medium">Availability</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-4 border-b text-center">
                      <span
                        className={
                          product.stock > 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                  ))}
                </tr>
                {products.some((p) => p.sizes && p.sizes.length > 0) && (
                  <tr>
                    <td className="p-4 border-b font-medium">Sizes</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 border-b text-center">
                        {product.sizes && product.sizes.length > 0
                          ? product.sizes.join(", ")
                          : "N/A"}
                      </td>
                    ))}
                  </tr>
                )}
                {products.some((p) => p.colors && p.colors.length > 0) && (
                  <tr>
                    <td className="p-4 border-b font-medium">Colors</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 border-b text-center">
                        {product.colors && product.colors.length > 0
                          ? product.colors.join(", ")
                          : "N/A"}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

