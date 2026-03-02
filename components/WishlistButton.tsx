"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "./Toast";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({
  productId,
  className = "",
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetch("/api/wishlist")
        .then((res) => res.json())
        .then((data) => {
          const ids = (data.items || []).map((i: any) => i.productId);
          setIsWishlisted(ids.includes(productId));
        })
        .catch(() => {});
    } else {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]") as string[];
      setIsWishlisted(wishlist.includes(productId));
    }
  }, [productId, session]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    if (session) {
      try {
        const method = isWishlisted ? "DELETE" : "POST";
        const res = await fetch("/api/wishlist", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          setIsWishlisted(!isWishlisted);
          showToast(isWishlisted ? "Removed from wishlist" : "Added to wishlist", "success");
        } else {
          showToast("Failed to update wishlist", "error");
        }
      } catch {
        showToast("Failed to update wishlist", "error");
      } finally {
        setLoading(false);
      }
    } else {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]") as string[];
      if (isWishlisted) {
        const updated = wishlist.filter((id) => id !== productId);
        localStorage.setItem("wishlist", JSON.stringify(updated));
        setIsWishlisted(false);
        showToast("Removed from wishlist", "success");
      } else {
        wishlist.push(productId);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        setIsWishlisted(true);
        showToast("Added to wishlist", "success");
      }
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-full transition-all ${
        isWishlisted
          ? "bg-red-600 text-white"
          : "bg-white text-gray-700 hover:bg-gray-100"
      } ${className}`}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
    </button>
  );
}

