import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

const SETTINGS_ID = "default";

export async function GET() {
  try {
    const featured = await prisma.featuredMatch.findUnique({
      where: { id: SETTINGS_ID },
    });
    return NextResponse.json({
      imageUrl: featured?.imageUrl ?? null,
      videoUrl: featured?.videoUrl ?? null,
      title: featured?.title ?? null,
    });
  } catch (error) {
    console.error("Error fetching featured match:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured match" },
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

  const allowed = await enforce(role || "customer", "featured-match", "write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { imageUrl, videoUrl, title } = body;

    const featured = await prisma.featuredMatch.upsert({
      where: { id: SETTINGS_ID },
      update: {
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(title !== undefined && { title: title || null }),
      },
      create: {
        id: SETTINGS_ID,
        imageUrl: imageUrl ?? null,
        videoUrl: videoUrl ?? null,
        title: title ?? null,
      },
    });

    return NextResponse.json(featured);
  } catch (error) {
    console.error("Error updating featured match:", error);
    return NextResponse.json(
      { error: "Failed to update featured match" },
      { status: 500 }
    );
  }
}
