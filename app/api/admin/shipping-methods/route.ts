import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "shipping-methods", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "true";
    const where = includeInactive ? {} : { active: true };

    const methods = await prisma.shippingMethod.findMany({
      where,
      orderBy: [{ cost: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Admin shipping methods fetch error:", error);
    return NextResponse.json({ error: "Failed to load shipping methods" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "shipping-methods", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, type, cost, freeThreshold, estimatedDays, active } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const validTypes = ["flat", "weight", "price"];
    const typeValue = type && validTypes.includes(type) ? type : "flat";
    const costValue = typeof cost === "number" ? cost : parseFloat(cost) || 0;

    const method = await prisma.shippingMethod.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        type: typeValue,
        cost: costValue,
        freeThreshold: freeThreshold != null ? parseFloat(freeThreshold) : null,
        estimatedDays: estimatedDays != null ? parseInt(estimatedDays, 10) : null,
        active: active !== false,
      },
    });
    return NextResponse.json(method);
  } catch (error) {
    console.error("Admin shipping method create error:", error);
    return NextResponse.json({ error: "Failed to create shipping method" }, { status: 500 });
  }
}
