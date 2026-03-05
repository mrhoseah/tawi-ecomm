import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "products", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Admin product fetch error:", error);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "products", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    const fields = [
      "name", "slug", "description", "shortDescription", "price", "compareAtPrice",
      "printable", "printingCost", "sku", "category", "tags", "images", "sizes", "colors",
      "stock", "lowStockThreshold", "weight", "dimensions",
      "featured", "active", "onSale", "newArrival", "bestSeller", "freeShippingEligible",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === "tags" || f === "images" || f === "sizes" || f === "colors") {
          data[f] = Array.isArray(body[f]) ? body[f] : [];
        } else if (f === "price" || f === "compareAtPrice" || f === "printingCost" || f === "weight") {
          data[f] = body[f] == null ? null : parseFloat(body[f]);
        } else if (f === "stock" || f === "lowStockThreshold") {
          data[f] = body[f] == null ? 0 : parseInt(body[f], 10);
        } else if (f === "printable" || f === "featured" || f === "active" || f === "onSale" || f === "newArrival" || f === "bestSeller" || f === "freeShippingEligible") {
          data[f] = body[f] === true;
        } else {
          data[f] = body[f] ?? (f.includes("Description") || f === "sku" ? null : "");
        }
      }
    }

    const nextPrice =
      data.price !== undefined
        ? (data.price as number | null)
        : product.price;
    const nextCompareAt =
      data.compareAtPrice !== undefined
        ? (data.compareAtPrice as number | null)
        : product.compareAtPrice;
    const nextStock =
      data.stock !== undefined
        ? (data.stock as number)
        : product.stock;
    const nextLowStockThreshold =
      data.lowStockThreshold !== undefined
        ? (data.lowStockThreshold as number)
        : product.lowStockThreshold;
    const nextImages =
      data.images !== undefined
        ? ((data.images as unknown[]) ?? [])
        : product.images;
    const nextActive =
      data.active !== undefined
        ? (data.active as boolean)
        : product.active;
    const nextOnSale =
      data.onSale !== undefined
        ? (data.onSale as boolean)
        : product.onSale;

    if (nextPrice == null || Number.isNaN(nextPrice) || nextPrice <= 0) {
      return NextResponse.json(
        { error: "price must be a number greater than 0" },
        { status: 400 }
      );
    }
    if (nextStock < 0) {
      return NextResponse.json(
        { error: "stock cannot be negative" },
        { status: 400 }
      );
    }
    if (nextLowStockThreshold != null && nextLowStockThreshold < 0) {
      return NextResponse.json(
        { error: "lowStockThreshold cannot be negative" },
        { status: 400 }
      );
    }
    if (nextOnSale) {
      if (nextCompareAt == null || Number.isNaN(nextCompareAt)) {
        return NextResponse.json(
          { error: "compareAtPrice is required when onSale is true" },
          { status: 400 }
        );
      }
      if (nextCompareAt <= nextPrice) {
        return NextResponse.json(
          { error: "compareAtPrice must be greater than price when onSale is true" },
          { status: 400 }
        );
      }
    }

    if (nextActive && (!Array.isArray(nextImages) || nextImages.length === 0)) {
      return NextResponse.json(
        { error: "Active products must include at least one image" },
        { status: 400 }
      );
    }

    if (body.slug !== undefined && body.slug !== product.slug) {
      const existing = await prisma.product.findUnique({ where: { slug: body.slug } });
      if (existing) {
        return NextResponse.json({ error: "A product with this slug already exists" }, { status: 400 });
      }
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "products", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await prisma.product.delete({ where: { id: product.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin product delete error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
