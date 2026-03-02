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
