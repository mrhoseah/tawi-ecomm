import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/casbin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "matches", "read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    return NextResponse.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json({ error: "Failed to load match" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "matches", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { homeTeam, awayTeam, matchDate, venue, status, accessPrice, videoUrl, imageUrl, featured } = body;

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (homeTeam !== undefined) data.homeTeam = String(homeTeam).trim();
    if (awayTeam !== undefined) data.awayTeam = String(awayTeam).trim();
    if (matchDate !== undefined) data.matchDate = new Date(matchDate);
    if (venue !== undefined) data.venue = venue ? String(venue).trim() : null;
    if (status !== undefined) data.status = status;
    if (accessPrice !== undefined) data.accessPrice = parseFloat(accessPrice);
    if (videoUrl !== undefined) data.videoUrl = videoUrl ? String(videoUrl).trim() : null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl ? String(imageUrl).trim() : null;
    if (featured !== undefined) data.featured = featured === true;

    const match = await prisma.match.update({ where: { id }, data });

    if (featured === true) {
      await prisma.match.updateMany({
        where: { id: { not: id } },
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

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role || "customer";

  try {
    await requirePermission(role, "matches", "write");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    await prisma.match.delete({ where: { id } });

    if (existing.featured) {
      const nextFeatured = await prisma.match.findFirst({ where: { featured: false }, orderBy: { matchDate: "desc" } });
      if (nextFeatured) {
        await prisma.match.update({ where: { id: nextFeatured.id }, data: { featured: true } });
        await prisma.featuredMatch.upsert({
          where: { id: "default" },
          update: {
            imageUrl: nextFeatured.imageUrl ?? null,
            videoUrl: nextFeatured.videoUrl ?? null,
            title: `${nextFeatured.homeTeam} vs ${nextFeatured.awayTeam}`,
          },
          create: {
            id: "default",
            imageUrl: nextFeatured.imageUrl ?? null,
            videoUrl: nextFeatured.videoUrl ?? null,
            title: `${nextFeatured.homeTeam} vs ${nextFeatured.awayTeam}`,
          },
        });
      } else {
        await prisma.featuredMatch.upsert({
          where: { id: "default" },
          update: { imageUrl: null, videoUrl: null, title: null },
          create: { id: "default", imageUrl: null, videoUrl: null, title: null },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
  }
}
