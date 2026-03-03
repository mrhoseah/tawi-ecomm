import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role || "customer";
  try {
    await requirePermission(role, "coupons", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role || "customer";
  try {
    await requirePermission(role, "coupons", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
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

    if (!code || !type || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "Missing required: code, type, validFrom, validUntil" },
        { status: 400 }
      );
    }
    if (type !== "free_shipping" && (value === undefined || value === null)) {
      return NextResponse.json({ error: "value is required for percentage and fixed coupons" }, { status: 400 });
    }
    const validTypes = ["percentage", "fixed", "free_shipping"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "type must be percentage, fixed, or free_shipping" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: String(code).toUpperCase(),
        type,
        value: value != null ? parseFloat(value) : 0,
        minPurchase: minPurchase != null ? parseFloat(minPurchase) : 0,
        maxDiscount: maxDiscount != null ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit != null ? parseInt(usageLimit, 10) : null,
        usageLimitPerUser: usageLimitPerUser != null ? parseInt(usageLimitPerUser, 10) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        freeShipping: type === "free_shipping" || body.freeShipping === true,
        description: body.description || null,
        active: active !== false,
        showOnPromoBar: showOnPromoBar === true,
        promoBarLabel: promoBarLabel != null ? String(promoBarLabel).trim() || null : null,
        promoBarSortOrder: promoBarSortOrder != null ? parseInt(promoBarSortOrder, 10) || 0 : 0,
      },
    });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
