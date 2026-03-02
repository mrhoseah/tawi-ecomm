import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.json();
  const userId = (session.user as any).id;

  const existing = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  if (body.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const data: Record<string, unknown> = {};
  const allowed = [
    "type", "firstName", "lastName", "company", "address1", "address2",
    "city", "state", "postalCode", "country", "phone", "isDefault",
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const address = await prisma.address.update({
    where: { id },
    data,
  });
  return NextResponse.json({ address });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const userId = (session.user as any).id;

  const existing = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
