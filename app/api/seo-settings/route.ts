import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enforce } from "@/lib/casbin";

const SETTINGS_ID = "default";

export async function GET() {
  try {
    const settings = await prisma.seoSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    return NextResponse.json({
      siteName: settings?.siteName ?? "Tawi TV",
      defaultMetaDesc: settings?.defaultMetaDesc ?? null,
      metaKeywords: settings?.metaKeywords ?? null,
      ogImage: settings?.ogImage ?? null,
      googleTagId: settings?.googleTagId ?? null,
      facebookPixelId: settings?.facebookPixelId ?? null,
      twitterHandle: settings?.twitterHandle ?? null,
      canonicalBase: settings?.canonicalBase ?? null,
    });
  } catch (error) {
    console.error("Error fetching SEO settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch SEO settings" },
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

  const allowed = await enforce(role || "customer", "seo-settings", "write");
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      siteName,
      defaultMetaDesc,
      metaKeywords,
      ogImage,
      googleTagId,
      facebookPixelId,
      twitterHandle,
      canonicalBase,
    } = body;

    const settings = await prisma.seoSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        ...(siteName !== undefined && { siteName: siteName || null }),
        ...(defaultMetaDesc !== undefined && { defaultMetaDesc: defaultMetaDesc || null }),
        ...(metaKeywords !== undefined && { metaKeywords: metaKeywords || null }),
        ...(ogImage !== undefined && { ogImage: ogImage || null }),
        ...(googleTagId !== undefined && { googleTagId: googleTagId || null }),
        ...(facebookPixelId !== undefined && { facebookPixelId: facebookPixelId || null }),
        ...(twitterHandle !== undefined && { twitterHandle: twitterHandle || null }),
        ...(canonicalBase !== undefined && { canonicalBase: canonicalBase || null }),
      },
      create: {
        id: SETTINGS_ID,
        siteName: siteName ?? null,
        defaultMetaDesc: defaultMetaDesc ?? null,
        metaKeywords: metaKeywords ?? null,
        ogImage: ogImage ?? null,
        googleTagId: googleTagId ?? null,
        facebookPixelId: facebookPixelId ?? null,
        twitterHandle: twitterHandle ?? null,
        canonicalBase: canonicalBase ?? null,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating SEO settings:", error);
    return NextResponse.json(
      { error: "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}
