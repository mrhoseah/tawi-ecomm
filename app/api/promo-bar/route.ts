import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Public API: returns active coupons with showOnPromoBar for the landing page promo bar. */
export async function GET() {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        showOnPromoBar: true,
        active: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: [{ promoBarSortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        code: true,
        promoBarLabel: true,
        type: true,
        value: true,
      },
    });

    const items = coupons.map((c) => ({
      id: c.id,
      code: c.code,
      label:
        c.promoBarLabel?.trim() ||
        formatDefaultLabel(c.type, c.value),
      href: "/shop",
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Promo bar fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load promo bar" },
      { status: 500 }
    );
  }
}

function formatDefaultLabel(type: string, value: number): string {
  if (type === "free_shipping") return "Free shipping";
  if (type === "percentage") return `Use code for ${value}% off`;
  if (type === "fixed") return `Use code for $${value.toFixed(2)} off`;
  return "Special offer";
}
