import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import TeamDetailTabs from "./TeamDetailTabs";
import { ArrowLeft } from "lucide-react";

async function getTeam(slug: string) {
  try {
    return await prisma.team.findUnique({
      where: { slug, active: true },
    });
  } catch (error) {
    return null;
  }
}

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = await getTeam(slug);

  if (!team) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/teams" className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Link>

          <div className="flex flex-col md:flex-row md:items-start gap-8 mb-12">
            <Avatar src={team.logoUrl} fallback={team.name} size="lg" className="h-24 w-24 shrink-0" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{team.name}</h1>
              <p className="text-gray-500 capitalize mb-4">{team.sportType}</p>
              {team.description && (
                <p className="text-gray-600 max-w-2xl">{team.description}</p>
              )}
            </div>
          </div>

          <TeamDetailTabs teamName={team.name} teamSlug={team.slug} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
