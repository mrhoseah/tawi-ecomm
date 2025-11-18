import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");

    if (ids) {
      const productIds = ids.split(",");
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          active: true,
        },
      });

      // Maintain order from request
      const ordered = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean);

      return NextResponse.json({ products: ordered });
    }

    return NextResponse.json({ products: [] });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

