import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  const userId = (session.user as { id?: string })?.id;

  try {
    if (role === "admin" || role === "support") {
      const allowed = await enforce(role, "returns", "read");
      if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const returns = await prisma.orderReturn.findMany({
        include: { order: { select: { orderNumber: true, total: true } }, user: { select: { name: true, email: true } } },
        orderBy: { requestedAt: "desc" },
      });
      return NextResponse.json(returns);
    }
    const returns = await prisma.orderReturn.findMany({
      where: { userId },
      include: { order: { select: { orderNumber: true, total: true } } },
      orderBy: { requestedAt: "desc" },
    });
    return NextResponse.json(returns);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { orderId, reason } = body;
    if (!orderId || !reason) return NextResponse.json({ error: "orderId and reason required" }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const existing = await prisma.orderReturn.findUnique({ where: { orderId } });
    if (existing) return NextResponse.json({ error: "Return already requested" }, { status: 400 });

    const orderReturn = await prisma.orderReturn.create({ data: { orderId, userId, reason } });
    return NextResponse.json(orderReturn);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
