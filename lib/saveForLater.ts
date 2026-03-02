"use client";

export interface SaveForLaterItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  printedName?: string;
  printedNumber?: string;
  printingCost?: number;
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
      s.color === item.color &&
      (s.printedName || "") === (item.printedName || "") &&
      (s.printedNumber || "") === (item.printedNumber || "")
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

export function removeFromSaveForLater(
  productId: string,
  size?: string,
  color?: string,
  printedName?: string,
  printedNumber?: string
) {
  if (typeof window === "undefined") return;

  const saved = JSON.parse(
    localStorage.getItem("saveForLater") || "[]"
  ) as SaveForLaterItem[];

  const filtered = saved.filter(
    (s) =>
      !(
        s.productId === productId &&
        (s.size || undefined) === (size || undefined) &&
        (s.color || undefined) === (color || undefined) &&
        (s.printedName || "") === (printedName || "") &&
        (s.printedNumber || "") === (printedNumber || "")
      )
  );

  localStorage.setItem("saveForLater", JSON.stringify(filtered));
}

