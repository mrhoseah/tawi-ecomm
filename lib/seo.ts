import { Metadata } from "next";
import { prisma } from "./prisma";

const DEFAULT_SITE_NAME = "Tawi TV";
const DEFAULT_DESCRIPTION =
  "Official Tawi Shop - Your destination for premium sports jerseys, kits, and athletic apparel. Owned by Tawi TV, your trusted sports broadcasting partner.";

export async function getSeoSettings() {
  try {
    const settings = await prisma.seoSettings.findUnique({
      where: { id: "default" },
    });
    return {
      siteName: settings?.siteName || DEFAULT_SITE_NAME,
      tagline: settings?.tagline || "Premium Sports Gear",
      defaultMetaDesc: settings?.defaultMetaDesc || DEFAULT_DESCRIPTION,
      metaKeywords: settings?.metaKeywords || null,
      ogImage: settings?.ogImage || null,
      googleTagId: settings?.googleTagId || null,
      facebookPixelId: settings?.facebookPixelId || null,
      twitterHandle: settings?.twitterHandle || null,
      canonicalBase: settings?.canonicalBase || null,
    };
  } catch {
    return {
      siteName: DEFAULT_SITE_NAME,
      tagline: "Premium Sports Gear",
      defaultMetaDesc: DEFAULT_DESCRIPTION,
      metaKeywords: null,
      ogImage: null,
      googleTagId: null,
      facebookPixelId: null,
      twitterHandle: null,
      canonicalBase: null,
    };
  }
}

export function buildMetadata(params: {
  title: string;
  description?: string;
  image?: string | null;
  url?: string;
  noIndex?: boolean;
  siteName?: string;
  defaultMetaDesc?: string;
}): Metadata {
  const {
    title,
    description,
    image,
    url,
    noIndex,
    siteName = DEFAULT_SITE_NAME,
    defaultMetaDesc = DEFAULT_DESCRIPTION,
  } = params;

  const desc = description || defaultMetaDesc;
  const ogImage = image || undefined;
  const canonicalUrl = url || undefined;

  return {
    title,
    description: desc,
    openGraph: {
      title: `${title} | ${siteName}`,
      description: desc,
      ...(ogImage && { images: [ogImage] }),
      ...(canonicalUrl && { url: canonicalUrl }),
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description: desc,
      ...(ogImage && { images: [ogImage] }),
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}
