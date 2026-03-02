import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPayPalOrder } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderNumber, amount } = body;
    if (!orderNumber || amount == null) {
      return NextResponse.json(
        { error: "orderNumber and amount required" },
        { status: 400 }
      );
    }

    const paypalOrder = await createPayPalOrder(
      parseFloat(amount),
      orderNumber
    );
    return NextResponse.json({ paypalOrderId: paypalOrder.id });
  } catch (error) {
    console.error("PayPal create order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PayPal create order failed" },
      { status: 500 }
    );
  }
}
