import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

const SETTINGS_ID = "default";

export async function GET() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    const allowed = await enforce(role || "customer", "currency-settings", "read");
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.currencySettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    return NextResponse.json({
      baseCurrency: settings?.baseCurrency ?? "KES",
      defaultDisplayCurrency: settings?.defaultDisplayCurrency ?? "KES",
      exchangeRateApiUrl: settings?.exchangeRateApiUrl ?? "",
      exchangeRateApiKey: settings?.exchangeRateApiKey ?? "",
      exchangeRateFallback: settings?.exchangeRateFallback ?? 0.0077,
    });
  } catch (error) {
    console.error("Error fetching currency settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch currency settings" },
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

  const allowed = await enforce(role || "customer", "currency-settings", "write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      baseCurrency,
      defaultDisplayCurrency,
      exchangeRateApiUrl,
      exchangeRateApiKey,
      exchangeRateFallback,
    } = body;

    const settings = await prisma.currencySettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        ...(baseCurrency !== undefined && { baseCurrency }),
        ...(defaultDisplayCurrency !== undefined && { defaultDisplayCurrency }),
        ...(exchangeRateApiUrl !== undefined && { exchangeRateApiUrl }),
        ...(exchangeRateApiKey !== undefined && { exchangeRateApiKey }),
        ...(exchangeRateFallback !== undefined && { exchangeRateFallback }),
      },
      create: {
        id: SETTINGS_ID,
        baseCurrency: baseCurrency ?? "KES",
        defaultDisplayCurrency: defaultDisplayCurrency ?? "KES",
        exchangeRateApiUrl: exchangeRateApiUrl ?? null,
        exchangeRateApiKey: exchangeRateApiKey ?? null,
        exchangeRateFallback: exchangeRateFallback ?? 0.0077,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating currency settings:", error);
    return NextResponse.json(
      { error: "Failed to update currency settings" },
      { status: 500 }
    );
  }
}
