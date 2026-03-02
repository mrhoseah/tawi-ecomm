import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "shipping-methods", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const method = await prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) return NextResponse.json({ error: "Shipping method not found" }, { status: 404 });
    return NextResponse.json(method);
  } catch (error) {
    console.error("Admin shipping method fetch error:", error);
    return NextResponse.json({ error: "Failed to load shipping method" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "shipping-methods", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const method = await prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) return NextResponse.json({ error: "Shipping method not found" }, { status: 404 });

    const body = await request.json();
    const validTypes = ["flat", "weight", "price"];
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.type !== undefined) data.type = validTypes.includes(body.type) ? body.type : method.type;
    if (body.cost !== undefined) data.cost = typeof body.cost === "number" ? body.cost : parseFloat(body.cost) ?? method.cost;
    if (body.freeThreshold !== undefined) data.freeThreshold = body.freeThreshold == null || body.freeThreshold === "" ? null : parseFloat(body.freeThreshold);
    if (body.estimatedDays !== undefined) data.estimatedDays = body.estimatedDays == null || body.estimatedDays === "" ? null : parseInt(body.estimatedDays, 10);
    if (body.active !== undefined) data.active = body.active === true;

    const updated = await prisma.shippingMethod.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin shipping method update error:", error);
    return NextResponse.json({ error: "Failed to update shipping method" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "shipping-methods", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const method = await prisma.shippingMethod.findUnique({ where: { id } });
    if (!method) return NextResponse.json({ error: "Shipping method not found" }, { status: 404 });

    await prisma.shippingMethod.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin shipping method delete error:", error);
    return NextResponse.json({ error: "Failed to delete shipping method" }, { status: 500 });
  }
}
