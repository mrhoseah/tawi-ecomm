import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: (session.user as any).id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      shippingMethod,
      couponCode,
    } = body;

    const userId = (session.user as any).id;

    // Generate order number
    const orderNumber = `TAWI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Find coupon if code provided
    let couponId = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (coupon) {
        couponId = coupon.id;
        // Update coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Decrement stock for each item without going below zero
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      });

      if (!product) continue;

      const decrementBy = Math.min(product.stock, item.quantity);
      if (decrementBy > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: decrementBy } },
        });
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod,
        subtotal,
        discount: discount || 0,
        tax,
        shipping,
        total,
        shippingAddress,
        shippingMethod: shippingMethod || null,
        couponId,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size || null,
            color: item.color || null,
            printedName: item.printedName || null,
            printedNumber: item.printedNumber || null,
            printingCost: item.printingCost || 0,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
