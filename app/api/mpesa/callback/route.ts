import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";

/**
 * M-Pesa STK Push callback - Safaricom posts here when customer completes or cancels payment.
 * No auth - called by Safaricom servers. Validate via IP or signature in production.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      console.warn("M-Pesa callback: missing Body.stkCallback");
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    if (!CheckoutRequestID) {
      console.warn("M-Pesa callback: missing CheckoutRequestID");
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const stkRequest = await prisma.mpesaStkRequest.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
    });

    if (!stkRequest) {
      console.warn("M-Pesa callback: unknown CheckoutRequestID", CheckoutRequestID);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Already processed
    if (stkRequest.status !== "pending") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    let mpesaReceiptNumber: string | null = null;
    if (CallbackMetadata?.Item && Array.isArray(CallbackMetadata.Item)) {
      const item = CallbackMetadata.Item.find((x: { Name: string }) => x.Name === "MpesaReceiptNumber");
      if (item?.Value) mpesaReceiptNumber = String(item.Value);
    }

    if (ResultCode === 0) {
      // Payment successful
      const order = await prisma.order.findUnique({
        where: { orderNumber: stkRequest.orderNumber },
        include: {
          user: { select: { email: true, name: true } },
          items: { include: { product: { select: { name: true, images: true } } } },
        },
      });

      if (order) {
        await prisma.$transaction([
          prisma.order.update({
            where: { orderNumber: stkRequest.orderNumber },
            data: { paymentStatus: "paid" },
          }),
          prisma.mpesaStkRequest.update({
            where: { checkoutRequestId: CheckoutRequestID },
            data: { status: "completed", mpesaReceiptNumber },
          }),
        ]);

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
            paymentMethod: order.paymentMethod || "M-Pesa",
          }).catch((err) => console.error("Order confirmation email failed:", err));
        }
      } else {
        await prisma.mpesaStkRequest.update({
          where: { checkoutRequestId: CheckoutRequestID },
          data: { status: "completed", mpesaReceiptNumber },
        });
      }
    } else {
      // Payment failed or cancelled
      await prisma.mpesaStkRequest.update({
        where: { checkoutRequestId: CheckoutRequestID },
        data: { status: "failed" },
      });
      console.log("M-Pesa payment failed:", CheckoutRequestID, ResultCode, ResultDesc);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
