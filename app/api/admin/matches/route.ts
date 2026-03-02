import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "matches", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const matches = await prisma.match.findMany({
      orderBy: { matchDate: "desc" },
    });
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "matches", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { homeTeam, awayTeam, matchDate, venue, status, accessPrice, videoUrl, imageUrl, featured } = body;

    if (!homeTeam || !awayTeam || !matchDate) {
      return NextResponse.json({ error: "homeTeam, awayTeam, and matchDate required" }, { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        homeTeam: String(homeTeam).trim(),
        awayTeam: String(awayTeam).trim(),
        matchDate: new Date(matchDate),
        venue: venue ? String(venue).trim() : null,
        status: status || "scheduled",
        accessPrice: accessPrice != null ? parseFloat(accessPrice) : 0,
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        featured: featured === true,
      },
    });

    if (featured === true) {
      await prisma.match.updateMany({
        where: { id: { not: match.id } },
        data: { featured: false },
      });
      await prisma.featuredMatch.upsert({
        where: { id: "default" },
        update: {
          imageUrl: match.imageUrl ?? null,
          videoUrl: match.videoUrl ?? null,
          title: `${match.homeTeam} vs ${match.awayTeam}`,
        },
        create: {
          id: "default",
          imageUrl: match.imageUrl ?? null,
          videoUrl: match.videoUrl ?? null,
          title: `${match.homeTeam} vs ${match.awayTeam}`,
        },
      });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
