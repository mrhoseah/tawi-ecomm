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
    await requirePermission(role, "coupons", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        orders: {
          select: { id: true, orderNumber: true, total: true, discount: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Admin coupon fetch error:", error);
    return NextResponse.json({ error: "Failed to load coupon" }, { status: 500 });
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
    await requirePermission(role, "coupons", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      usageLimit,
      usageLimitPerUser,
      validFrom,
      validUntil,
      freeShipping,
      description,
      active,
      showOnPromoBar,
      promoBarLabel,
      promoBarSortOrder,
    } = body;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (code !== undefined) data.code = String(code).toUpperCase();
    if (type !== undefined) {
      const validTypes = ["percentage", "fixed", "free_shipping"];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: "type must be percentage, fixed, or free_shipping" }, { status: 400 });
      }
      data.type = type;
    }
    if (value !== undefined) data.value = parseFloat(value);
    if (minPurchase !== undefined) data.minPurchase = parseFloat(minPurchase);
    if (maxDiscount !== undefined) data.maxDiscount = maxDiscount == null ? null : parseFloat(maxDiscount);
    if (usageLimit !== undefined) data.usageLimit = usageLimit == null ? null : parseInt(usageLimit, 10);
    if (usageLimitPerUser !== undefined) data.usageLimitPerUser = usageLimitPerUser == null ? null : parseInt(usageLimitPerUser, 10);
    if (validFrom !== undefined) data.validFrom = new Date(validFrom);
    if (validUntil !== undefined) data.validUntil = new Date(validUntil);
    if (freeShipping !== undefined) data.freeShipping = freeShipping === true;
    if (description !== undefined) data.description = description || null;
    if (active !== undefined) data.active = active === true;
    if (showOnPromoBar !== undefined) data.showOnPromoBar = showOnPromoBar === true;
    if (promoBarLabel !== undefined) data.promoBarLabel = promoBarLabel != null ? String(promoBarLabel).trim() || null : null;
    if (promoBarSortOrder !== undefined) data.promoBarSortOrder = parseInt(promoBarSortOrder, 10) || 0;

    if (code !== undefined && code !== existing.code) {
      const dup = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
      if (dup) return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });
    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Admin coupon update error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
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
    await requirePermission(role, "coupons", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin coupon delete error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
