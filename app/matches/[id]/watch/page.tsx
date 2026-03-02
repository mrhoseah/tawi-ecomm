import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getYouTubeVideoId } from "@/lib/youtube";
import { ArrowLeft, Lock } from "lucide-react";

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

export default async function MatchWatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
          <Link
            href={`/matches/${match.id}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Match
          </Link>

          {!userHasAccess ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
              <Lock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h1>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You need to purchase access to watch this match. Visit the match page to get access.
              </p>
              <Link
                href={`/matches/${match.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Match Detail
              </Link>
            </div>
          ) : match.videoUrl ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-4">
                {match.homeTeam} vs {match.awayTeam}
              </h1>
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                {(() => {
                  const videoId = getYouTubeVideoId(match.videoUrl);
                  return videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
                      title="Match Stream"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      Invalid video URL
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {match.homeTeam} vs {match.awayTeam}
              </h1>
              <p className="text-gray-600">
                Stream will be available at match time.
              </p>
              <div className="mt-6 rounded-lg border border-dashed border-gray-300 py-12 text-gray-500">
                <p className="font-medium">Coming soon</p>
                <p className="text-sm mt-1">Check back when the match starts</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
