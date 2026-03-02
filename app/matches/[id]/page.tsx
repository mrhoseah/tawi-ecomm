import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import MatchDetailClient from "./MatchDetailClient";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

async function getMatch(id: string) {
  try {
    return await prisma.match.findUnique({ where: { id } });
  } catch (error) {
    return null;
  }
}

async function hasAccess(userId: string, matchId: string) {
  try {
    const access = await prisma.matchAccess.findUnique({
      where: { userId_matchId: { userId, matchId } },
    });
    return !!access;
  } catch (error) {
    return false;
  }
}

function formatMatchDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);
  const session = await auth();

  if (!match) notFound();

  const userId = (session?.user as { id?: string })?.id;
  const userHasAccess = userId ? await hasAccess(userId, match.id) : false;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/matches" className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Matches
          </Link>

          <div className="text-center mb-12">
            <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold bg-gray-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                  {match.homeTeam.slice(0, 1)}
                </span>
                <span className="text-xl md:text-2xl font-bold text-gray-900">{match.homeTeam}</span>
                <span className="text-sm text-gray-500">Home</span>
              </div>
              <span className="text-2xl font-bold text-gray-400">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-bold bg-gray-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                  {match.awayTeam.slice(0, 1)}
                </span>
                <span className="text-xl md:text-2xl font-bold text-gray-900">{match.awayTeam}</span>
                <span className="text-sm text-gray-500">Away</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-5 w-5" />
                {formatMatchDate(match.matchDate)}
              </span>
              {match.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  {match.venue}
                </span>
              )}
            </div>
            <span
              className={`inline-flex mt-3 rounded-full px-3 py-1 text-xs font-medium ${
                match.status === "live"
                  ? "bg-green-100 text-green-800"
                  : match.status === "finished"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {match.status}
            </span>
          </div>

          <section className="border border-gray-200 rounded-xl p-8 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Get Access to Watch</h2>
            <p className="text-gray-600 mb-6">
              Purchase access to this match or subscribe for unlimited streaming.
            </p>
            <MatchDetailClient
              matchId={match.id}
              accessPrice={match.accessPrice}
              hasAccess={userHasAccess}
              videoUrl={match.videoUrl}
              isSignedIn={!!session}
            />
            {!session && (
              <p className="text-sm text-gray-500 mt-4">You&apos;ll need to sign in to purchase.</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
