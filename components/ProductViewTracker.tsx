"use client";

import { useEffect } from "react";
import { addToRecentlyViewed } from "@/lib/recentlyViewed";

interface ProductViewTrackerProps {
  productId: string;
  productSlug: string;
}

export default function ProductViewTracker({
  productId,
  productSlug,
}: ProductViewTrackerProps) {
  useEffect(() => {
    addToRecentlyViewed(productId, productSlug);
  }, [productId, productSlug]);

  return null;
}

