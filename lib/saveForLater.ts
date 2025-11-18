"use client";

export interface SaveForLaterItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
}

export function saveForLater(item: SaveForLaterItem) {
  if (typeof window === "undefined") return;
  
  const saved = JSON.parse(
    localStorage.getItem("saveForLater") || "[]"
  ) as SaveForLaterItem[];

  // Check if already saved
  const exists = saved.some(
    (s) =>
      s.productId === item.productId &&
      s.size === item.size &&
      s.color === item.color
  );

  if (!exists) {
    saved.push(item);
    localStorage.setItem("saveForLater", JSON.stringify(saved));
  }
}

export function getSaveForLater(): SaveForLaterItem[] {
  if (typeof window === "undefined") return [];
  
  return JSON.parse(localStorage.getItem("saveForLater") || "[]");
}

export function removeFromSaveForLater(productId: string, size?: string, color?: string) {
  if (typeof window === "undefined") return;
  
  const saved = JSON.parse(
    localStorage.getItem("saveForLater") || "[]"
  ) as SaveForLaterItem[];

  const filtered = saved.filter(
    (s) =>
      !(s.productId === productId && s.size === size && s.color === color)
  );

  localStorage.setItem("saveForLater", JSON.stringify(filtered));
}

