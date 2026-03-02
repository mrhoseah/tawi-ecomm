import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const sportType = searchParams.get("sportType") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;
    let includeInactive = false;
    const incParam = searchParams.get("includeInactive");
    if (incParam === "true") {
      const session = await auth();
      const role = (session?.user as { role?: string })?.role;
      if (role === "admin" || role === "support") includeInactive = true;
    }

    const where: {
      active?: boolean;
      sportType?: { equals: string; mode: "insensitive" };
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; sportType?: { contains: string; mode: "insensitive" }; slug?: { contains: string; mode: "insensitive" } }>;
    } = {};
    if (!includeInactive) {
      where.active = true;
    }

    if (search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { sportType: { contains: term, mode: "insensitive" } },
        { slug: { contains: term.toLowerCase().replace(/\s+/g, "-"), mode: "insensitive" } },
      ];
    }
    if (sportType.trim()) {
      where.sportType = { equals: sportType.trim(), mode: "insensitive" };
    }

    const [teams, total, sportTypes] = await Promise.all([
      prisma.team.findMany({
        where,
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.team.count({ where }),
      prisma.team.findMany({ where: includeInactive ? {} : { active: true }, select: { sportType: true }, distinct: ["sportType"], orderBy: { sportType: "asc" } }),
    ]);

    return NextResponse.json({
      teams,
      sportTypes: sportTypes.map((t) => t.sportType),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await enforce(role || "customer", "teams", "write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, slug, logoUrl, sportType, description } = body;

    if (!name || !sportType) {
      return NextResponse.json(
        { error: "name and sportType are required" },
        { status: 400 }
      );
    }

    const slugValue = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await prisma.team.findUnique({
      where: { slug: slugValue },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A team with this slug already exists" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        slug: slugValue,
        logoUrl: logoUrl || null,
        sportType,
        description: description || null,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
