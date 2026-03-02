import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Professional shipping quote API.
 * Considers per-product free shipping eligibility:
 * - Products with freeShippingEligible=false do NOT qualify for free shipping threshold
 * - If ANY cart item is ineligible, order does not get free shipping
 * - If ALL items are eligible AND subtotal >= method's freeThreshold, shipping is free
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, subtotal } = body as {
      items: { productId: string; quantity: number }[];
      subtotal: number;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items required" },
        { status: 400 }
      );
    }

    // Check if any product is NOT eligible for free shipping
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, freeShippingEligible: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const hasIneligibleProduct = items.some((item) => {
      const p = productMap.get(item.productId);
      return p && p.freeShippingEligible === false;
    });

    const qualifiesForFreeThreshold = !hasIneligibleProduct;

    const methods = await prisma.shippingMethod.findMany({
      where: { active: true },
      orderBy: { cost: "asc" },
    });

    const quoteMethods = methods.map((m) => {
      const isFree =
        qualifiesForFreeThreshold &&
        m.freeThreshold != null &&
        subtotal >= m.freeThreshold;
      return {
        id: m.id,
        name: m.name,
        description: m.description,
        cost: isFree ? 0 : m.cost,
        isFree,
        estimatedDays: m.estimatedDays,
      };
    });

    return NextResponse.json({
      methods: quoteMethods,
      qualifiesForFreeShipping: qualifiesForFreeThreshold,
      hasIneligibleProducts: hasIneligibleProduct,
    });
  } catch (error) {
    console.error("Shipping quote error:", error);
    return NextResponse.json(
      { error: "Failed to get shipping quote" },
      { status: 500 }
    );
  }
}
