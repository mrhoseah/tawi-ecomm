"use client";

export function addToRecentlyViewed(productId: string, productSlug: string) {
  if (typeof window === "undefined") return;
  
  const viewed = JSON.parse(
    localStorage.getItem("recentlyViewed") || "[]"
  ) as Array<{ id: string; slug: string; timestamp: number }>;

  // Remove if already exists
  const filtered = viewed.filter((item) => item.id !== productId);

  // Add to beginning
  filtered.unshift({
    id: productId,
    slug: productSlug,
    timestamp: Date.now(),
  });

  // Keep only last 10
  const limited = filtered.slice(0, 10);

  localStorage.setItem("recentlyViewed", JSON.stringify(limited));
}

export function getRecentlyViewed(): Array<{ id: string; slug: string }> {
  if (typeof window === "undefined") return [];
  
  const viewed = JSON.parse(
    localStorage.getItem("recentlyViewed") || "[]"
  ) as Array<{ id: string; slug: string; timestamp: number }>;

  // Remove items older than 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = viewed.filter((item) => item.timestamp > thirtyDaysAgo);

  localStorage.setItem("recentlyViewed", JSON.stringify(recent));

  return recent.map(({ id, slug }) => ({ id, slug }));
}

