import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [news, upcomingMatch] = await Promise.all([
      prisma.news.findFirst({
        orderBy: { publishedAt: "desc" },
      }),
      prisma.match.findFirst({
        where: {
          matchDate: { gte: new Date() },
          status: { in: ["scheduled", "live"] },
        },
        orderBy: { matchDate: "asc" },
      }),
    ]);
    return NextResponse.json({ news, upcomingMatch });
  } catch (error) {
    console.error("Error fetching home carousel:", error);
    return NextResponse.json(
      { error: "Failed to fetch carousel data" },
      { status: 500 }
    );
  }
}
