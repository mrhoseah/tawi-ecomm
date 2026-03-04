import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

const SETTINGS_ID = "default";

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    const allowed = await enforce(role || "customer", "tax-settings", "read");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.taxSettings.findUnique({
      where: { id: SETTINGS_ID },
    });

    return NextResponse.json({
      enabled: settings?.enabled ?? false,
      name: settings?.name ?? "VAT",
      rate: settings?.rate ?? 0.16,
      country: settings?.country ?? "Kenya",
    });
  } catch (error) {
    console.error("Error fetching tax settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await enforce(role || "customer", "tax-settings", "write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      enabled,
      name,
      rate,
      country,
    } = body;

    if (rate != null && (typeof rate !== "number" || rate < 0 || rate > 1)) {
      return NextResponse.json(
        { error: "Rate must be a decimal between 0 and 1 (e.g. 0.16 for 16%)." },
        { status: 400 }
      );
    }

    const settings = await prisma.taxSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(name !== undefined && { name }),
        ...(rate !== undefined && { rate }),
        ...(country !== undefined && { country }),
      },
      create: {
        id: SETTINGS_ID,
        enabled: enabled ?? false,
        name: name ?? "VAT",
        rate: rate ?? 0.16,
        country: country ?? "Kenya",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating tax settings:", error);
    return NextResponse.json(
      { error: "Failed to update tax settings" },
      { status: 500 }
    );
  }
}

