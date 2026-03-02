import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: (session.user as any).id },
      include: { product: true },
    });

    return NextResponse.json({ items: cartItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
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
    const { productId, quantity, size, color, printedName, printedNumber, printingCost } = body;

    const userId = (session.user as any).id;

    const printedNameVal = printedName || "";
    const printedNumberVal = printedNumber || "";

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId_size_color_printedName_printedNumber: {
          userId,
          productId,
          size: size || null,
          color: color || null,
          printedName: printedNameVal,
          printedNumber: printedNumberVal,
        },
      },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          size: size || null,
          color: color || null,
          printedName: printedNameVal,
          printedNumber: printedNumberVal,
          printingCost: printingCost || 0,
        },
        include: { product: true },
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: "itemId and quantity (>= 0) required" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, userId },
      });
      return NextResponse.json({ success: true });
    }

    const existing = await prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID required" },
        { status: 400 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}

