import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: "matchId is required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const existing = await prisma.matchAccess.findUnique({
      where: { userId_matchId: { userId, matchId } },
    });
    if (existing) {
      return NextResponse.json({ alreadyOwned: true });
    }

    await prisma.matchAccess.create({
      data: {
        userId,
        matchId,
        amount: match.accessPrice,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Match access purchase error:", error);
    return NextResponse.json(
      { error: "Failed to grant access" },
      { status: 500 }
    );
  }
}
