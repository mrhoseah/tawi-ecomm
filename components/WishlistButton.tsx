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

  useEffect(() => {
    // Load wishlist from localStorage
    const wishlist = JSON.parse(
      localStorage.getItem("wishlist") || "[]"
    ) as string[];
    setIsWishlisted(wishlist.includes(productId));
  }, [productId]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const wishlist = JSON.parse(
      localStorage.getItem("wishlist") || "[]"
    ) as string[];

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

    // Sync with server if logged in
    if (session) {
      try {
        await fetch("/api/wishlist", {
          method: isWishlisted ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
      } catch (error) {
        console.error("Error syncing wishlist:", error);
      }
    }
  };

  return (
    <button
      onClick={toggleWishlist}
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

