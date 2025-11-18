"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import QuickViewModal from "./QuickViewModal";

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
  stock: number;
  category: string;
}

interface QuickViewButtonProps {
  product: Product;
  className?: string;
}

export default function QuickViewButton({
  product,
  className = "",
}: QuickViewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`absolute top-2 left-2 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-all z-10 ${className}`}
        aria-label="Quick view"
        title="Quick view"
      >
        <Eye className="h-4 w-4 text-gray-700" />
      </button>
      <QuickViewModal
        product={product}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

