import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const review = await prisma.review.update({
      where: { id },
      data: {
        helpful: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ helpful: review.helpful });
  } catch (error) {
    console.error("Error updating helpful:", error);
    return NextResponse.json(
      { error: "Failed to update helpful count" },
      { status: 500 }
    );
  }
}

