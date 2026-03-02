import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await prisma.team.findFirst({
      where: id.length > 20 ? { id } : { slug: id },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const team = await prisma.team.findFirst({
      where: id.length > 20 ? { id } : { slug: id },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, logoUrl, sportType, description, active } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
    if (sportType !== undefined) updateData.sportType = sportType;
    if (description !== undefined) updateData.description = description || null;
    if (active !== undefined) updateData.active = active;

    if (slug !== undefined && slug !== team.slug) {
      const existing = await prisma.team.findUnique({ where: { slug } });
      if (existing) {
        return NextResponse.json(
          { error: "A team with this slug already exists" },
          { status: 400 }
        );
      }
      updateData.slug = slug;
    }

    const updated = await prisma.team.update({
      where: { id: team.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const team = await prisma.team.findFirst({
      where: id.length > 20 ? { id } : { slug: id },
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const [matchCount, productCount] = await Promise.all([
      prisma.match.count({
        where: { OR: [{ homeTeam: team.name }, { awayTeam: team.name }] },
      }),
      prisma.product.count({
        where: { tags: { has: team.name } },
      }),
    ]);

    if (matchCount > 0 || productCount > 0) {
      const parts: string[] = [];
      if (matchCount > 0) parts.push(`${matchCount} match(es)`);
      if (productCount > 0) parts.push(`${productCount} product(s)`);
      return NextResponse.json(
        { error: `Cannot delete: This team is used in ${parts.join(" and ")}. Reassign or remove those first.` },
        { status: 400 }
      );
    }

    await prisma.team.delete({ where: { id: team.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
