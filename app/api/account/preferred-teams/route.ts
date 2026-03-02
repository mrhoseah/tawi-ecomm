import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await prisma.userPreferredTeam.findMany({
      where: { userId: session.user.id },
      include: { team: true },
      orderBy: { createdAt: "desc" },
    });
    const teams = prefs.map((p) => p.team);
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching preferred teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferred teams" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { teamIds } = body;
    if (!Array.isArray(teamIds)) {
      return NextResponse.json(
        { error: "teamIds must be an array" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    await prisma.$transaction(async (tx) => {
      await tx.userPreferredTeam.deleteMany({ where: { userId } });
      if (teamIds.length > 0) {
        const validTeamIds = teamIds.filter(
          (id: unknown): id is string => typeof id === "string" && id.length > 0
        );
        if (validTeamIds.length > 0) {
          await tx.userPreferredTeam.createMany({
            data: validTeamIds.map((teamId) => ({ userId, teamId })),
            skipDuplicates: true,
          });
        }
      }
    });

    const prefs = await prisma.userPreferredTeam.findMany({
      where: { userId },
      include: { team: true },
    });
    return NextResponse.json({
      teams: prefs.map((p) => p.team),
    });
  } catch (error) {
    console.error("Error updating preferred teams:", error);
    return NextResponse.json(
      { error: "Failed to update preferred teams" },
      { status: 500 }
    );
  }
}
