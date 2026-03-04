import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import SeoScripts from "@/components/SeoScripts";
import { getSeoSettings } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#dc2626",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, defaultMetaDesc } = await getSeoSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tawitv.com"),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: defaultMetaDesc,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <SeoScripts />
        </Providers>
      </body>
    </html>
  );
}
