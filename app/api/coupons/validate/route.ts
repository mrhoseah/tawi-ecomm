import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const subtotal = parseFloat(searchParams.get("subtotal") || "0");
    const userId = searchParams.get("userId") || null;

    if (!code) {
      return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: "Coupon is not active" }, { status: 400 });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
    }

    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    if (userId && coupon.usageLimitPerUser != null) {
      const userUsageCount = await prisma.order.count({
        where: { userId, couponId: coupon.id },
      });
      if (userUsageCount >= coupon.usageLimitPerUser) {
        return NextResponse.json({ error: "You have reached the maximum uses for this coupon" }, { status: 400 });
      }
    }

    const minPurchase = coupon.minPurchase ?? 0;
    if (subtotal < minPurchase) {
      return NextResponse.json({
        error: `Minimum purchase of $${minPurchase.toFixed(2)} required`,
      }, { status: 400 });
    }

    let discount = 0;
    const isFreeShipping = coupon.type === "free_shipping" || coupon.freeShipping;

    if (coupon.type === "percentage") {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount != null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === "fixed") {
      discount = Math.min(coupon.value, subtotal);
    }
    // free_shipping: discount stays 0; freeShipping flag set below

    return NextResponse.json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Math.round(discount * 100) / 100,
      maxDiscount: coupon.maxDiscount,
      freeShipping: isFreeShipping,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}

