import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "products", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = (page - 1) * limit;
    const category = searchParams.get("category") || undefined;
    const q = searchParams.get("q") || undefined;
    const active = searchParams.get("active");

    const where: Prisma.ProductWhereInput = {};
    if (category) where.category = category;
    if (active === "true") where.active = true;
    if (active === "false") where.active = false;
    if (q?.trim()) {
      where.OR = [
        { name: { contains: q.trim(), mode: "insensitive" } },
        { description: { contains: q.trim(), mode: "insensitive" } },
        { sku: { contains: q.trim(), mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin products fetch error:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "products", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      shortDescription,
      price,
      compareAtPrice,
      printable,
      printingCost,
      sku,
      category,
      tags,
      images,
      sizes,
      colors,
      stock,
      lowStockThreshold,
      weight,
      featured,
      active,
      onSale,
      newArrival,
      bestSeller,
      freeShippingEligible,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "name and price are required" },
        { status: 400 }
      );
    }

    const slugValue = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await prisma.product.findUnique({ where: { slug: slugValue } });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugValue,
        description: description || "",
        shortDescription: shortDescription || null,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice != null ? parseFloat(compareAtPrice) : null,
        printable: printable === true,
        printingCost: printingCost != null ? parseFloat(printingCost) : 0,
        sku: sku || null,
        category: category || "uncategorized",
        tags: Array.isArray(tags) ? tags : [],
        images: Array.isArray(images) ? images : [],
        sizes: Array.isArray(sizes) ? sizes : [],
        colors: Array.isArray(colors) ? colors : [],
        stock: stock != null ? parseInt(stock, 10) : 0,
        lowStockThreshold: lowStockThreshold != null ? parseInt(lowStockThreshold, 10) : 10,
        weight: weight != null ? parseFloat(weight) : null,
        featured: featured === true,
        active: active !== false,
        onSale: onSale === true,
        newArrival: newArrival === true,
        bestSeller: bestSeller === true,
        freeShippingEligible: freeShippingEligible !== false,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
