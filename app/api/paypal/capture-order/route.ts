import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { capturePayPalOrder } from "@/lib/paypal";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderNumber, paypalOrderId } = body;
    if (!orderNumber || !paypalOrderId) {
      return NextResponse.json(
        { error: "orderNumber and paypalOrderId required" },
        { status: 400 }
      );
    }

    const captureId = await capturePayPalOrder(paypalOrderId);
    if (!captureId) {
      return NextResponse.json(
        { error: "PayPal capture failed - no capture ID" },
        { status: 500 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    const order = await prisma.order.findFirst({
      where: { orderNumber, userId },
      include: {
        user: { select: { email: true, name: true } },
        items: { include: { product: { select: { name: true, images: true } } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.order.update({
      where: { orderNumber },
      data: { paymentStatus: "paid", paypalCaptureId: captureId },
    });

    if (order.user?.email) {
      sendOrderConfirmation({
        to: order.user.email,
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        items: order.items.map((i) => ({
          product: { name: i.product.name, images: i.product.images },
          quantity: i.quantity,
          price: i.price,
          size: i.size,
          color: i.color,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        paymentMethod: "PayPal",
      }).catch((err) => console.error("Order confirmation email failed:", err));
    }

    return NextResponse.json({ success: true, captureId });
  } catch (error) {
    console.error("PayPal capture order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PayPal capture failed" },
      { status: 500 }
    );
  }
}
