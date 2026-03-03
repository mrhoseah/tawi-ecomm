import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

const SETTINGS_ID = "default";

/** Public - used by middleware and maintenance page for countdown */
export async function GET() {
  try {
    const settings = await prisma.maintenanceSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    return NextResponse.json({
      enabled: settings?.enabled ?? false,
      estimatedEndAt: settings?.estimatedEndAt?.toISOString() ?? null,
      message: settings?.message ?? null,
    });
  } catch (error) {
    console.error("Error fetching maintenance settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance settings" },
      { status: 500 }
    );
  }
}

/** Admin only - update maintenance mode */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await enforce(role || "customer", "maintenance-settings", "write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { enabled, estimatedEndAt, message } = body;

    const settings = await prisma.maintenanceSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        ...(enabled !== undefined && { enabled: !!enabled }),
        ...(estimatedEndAt !== undefined && {
          estimatedEndAt: estimatedEndAt ? new Date(estimatedEndAt) : null,
        }),
        ...(message !== undefined && { message: message || null }),
      },
      create: {
        id: SETTINGS_ID,
        enabled: !!enabled,
        estimatedEndAt: estimatedEndAt ? new Date(estimatedEndAt) : null,
        message: message || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating maintenance settings:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance settings" },
      { status: 500 }
    );
  }
}
