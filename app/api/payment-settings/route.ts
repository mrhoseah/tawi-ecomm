import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

const SETTINGS_ID = "default";

export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.paymentSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    return NextResponse.json({
      bankName: settings?.bankName ?? "",
      accountName: settings?.accountName ?? "",
      accountNumber: settings?.accountNumber ?? "",
      branchName: settings?.branchName ?? "",
      swiftCode: settings?.swiftCode ?? "",
      bankCode: settings?.bankCode ?? "",
      instructions: settings?.instructions ?? "",
    });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await enforce(role || "customer", "payment-settings", "write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      bankName,
      accountName,
      accountNumber,
      branchName,
      swiftCode,
      bankCode,
      instructions,
    } = body;

    const settings = await prisma.paymentSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        ...(bankName !== undefined && { bankName }),
        ...(accountName !== undefined && { accountName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(branchName !== undefined && { branchName }),
        ...(swiftCode !== undefined && { swiftCode }),
        ...(bankCode !== undefined && { bankCode }),
        ...(instructions !== undefined && { instructions }),
      },
      create: {
        id: SETTINGS_ID,
        bankName: bankName ?? null,
        accountName: accountName ?? null,
        accountNumber: accountNumber ?? null,
        branchName: branchName ?? null,
        swiftCode: swiftCode ?? null,
        bankCode: bankCode ?? null,
        instructions: instructions ?? null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json(
      { error: "Failed to update payment settings" },
      { status: 500 }
    );
  }
}
