import { NextResponse } from "next/server";
import { getExchangeRate } from "@/lib/currency";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [rate, settings] = await Promise.all([
      getExchangeRate(),
      prisma.currencySettings.findUnique({ where: { id: "default" } }),
    ]);
    return NextResponse.json({
      rate,
      base: "KES",
      target: "USD",
      defaultDisplayCurrency: settings?.defaultDisplayCurrency ?? "KES",
    });
  } catch (error) {
    console.error("Currency rate error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}
