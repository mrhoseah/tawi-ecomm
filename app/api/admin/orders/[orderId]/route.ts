import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role || "customer";
  try {
    await requirePermission(role, "orders", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { orderId } = await context.params;
    const body = await request.json();
    const { status, paymentStatus, trackingNumber, trackingCarrier } = body;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
    if (trackingCarrier !== undefined) data.trackingCarrier = trackingCarrier || null;
    if (status === "shipped" && !body.shippedAt) {
      data.shippedAt = new Date();
    }
    if (body.shippedAt !== undefined) data.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null;

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
    });
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
