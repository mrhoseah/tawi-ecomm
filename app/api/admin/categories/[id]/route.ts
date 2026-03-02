import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "categories", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const where = id.length > 20 ? { id } : { slug: id };
    const category = await prisma.category.findFirst({ where });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json(category);
  } catch (error) {
    console.error("Admin category fetch error:", error);
    return NextResponse.json({ error: "Failed to load category" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "categories", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const where = id.length > 20 ? { id } : { slug: id };
    const category = await prisma.category.findFirst({ where });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.sortOrder !== undefined) data.sortOrder = parseInt(body.sortOrder, 10);
    if (body.active !== undefined) data.active = body.active === true;

    if (body.slug !== undefined && body.slug !== category.slug) {
      const existing = await prisma.category.findUnique({ where: { slug: body.slug } });
      if (existing) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 400 }
        );
      }
      data.slug = body.slug;
    }

    const updated = await prisma.category.update({
      where: { id: category.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin category update error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "categories", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const where = id.length > 20 ? { id } : { slug: id };
    const category = await prisma.category.findFirst({ where });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const productCount = await prisma.product.count({
      where: { category: category.slug },
    });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product(s) use this category. Reassign them first.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: category.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin category delete error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
