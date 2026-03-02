import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";
import { reverseMpesaTransaction } from "@/lib/mpesa-reversal";
import { refundPayPalCapture } from "@/lib/paypal";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  const allowed = await enforce(role || "customer", "returns", "write");
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (status === "approved" || status === "rejected" || status === "completed") {
      data.resolvedAt = new Date();
    }

    const orderReturn = await prisma.orderReturn.findUnique({ where: { id }, include: { order: true } });
    if (!orderReturn) return NextResponse.json({ error: "Return not found" }, { status: 404 });

    // When completing return: process refund based on payment method
    if (status === "completed" && orderReturn.order.paymentStatus === "paid") {
      const order = orderReturn.order;
      let refundNote = "";

      if (order.paymentMethod === "mpesa") {
        const stkRequest = await prisma.mpesaStkRequest.findFirst({
          where: { orderNumber: order.orderNumber, status: "completed" },
          orderBy: { createdAt: "desc" },
        });
        if (stkRequest?.mpesaReceiptNumber) {
          const result = await reverseMpesaTransaction(
            stkRequest.mpesaReceiptNumber,
            order.total,
            `Refund order ${order.orderNumber}`
          );
          if (result.success) {
            refundNote = `M-Pesa reversal initiated. ConversationID: ${result.conversationId || "N/A"}`;
          } else {
            refundNote = `M-Pesa reversal failed: ${result.error || result.responseDescription || "Unknown"}. Manual refund required.`;
          }
        } else {
          refundNote = "M-Pesa receipt not found. Manual reversal required.";
        }
      } else if (order.paymentMethod === "bank") {
        refundNote = "Bank refund: Process manual transfer to customer. Order payment status set to refunded.";
      } else if (order.paymentMethod === "paypal") {
        const captureId = (order as { paypalCaptureId?: string }).paypalCaptureId;
        if (captureId) {
          const result = await refundPayPalCapture(captureId);
          if (result.success) {
            refundNote = `PayPal refund completed. Refund ID: ${result.refundId || "N/A"}`;
          } else {
            refundNote = `PayPal refund failed: ${result.error}. Process via PayPal dashboard.`;
          }
        } else {
          refundNote = "PayPal capture ID not found. Process refund via PayPal dashboard.";
        }
      } else {
        refundNote = `Refund for ${order.paymentMethod || "unknown"} - process manually.`;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "refunded" },
      });
      if (refundNote) {
        data.notes = [orderReturn.notes, refundNote].filter(Boolean).join("\n\n");
      }
    }

    const updated = await prisma.orderReturn.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json({ error: "Failed to update return" }, { status: 500 });
  }
}
