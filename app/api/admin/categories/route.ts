import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "categories", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const where = includeInactive ? {} : { active: true };

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Admin categories fetch error:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "categories", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, imageUrl, sortOrder } = body;
    const nameTrimmed = String(name ?? "").trim();

    if (!nameTrimmed) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let slugValue = (slug && String(slug).trim()) || nameTrimmed.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!slugValue) slugValue = `category-${Date.now()}`;
    const existing = await prisma.category.findUnique({ where: { slug: slugValue } });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: nameTrimmed,
        slug: slugValue,
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder != null && !Number.isNaN(Number(sortOrder)) ? parseInt(sortOrder, 10) : 0,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Admin category create error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
