"use client";

import Link from "next/link";
import { Play } from "lucide-react";

interface MatchDetailClientProps {
  matchId: string;
  accessPrice: number;
  hasAccess: boolean;
  videoUrl: string | null;
  isSignedIn: boolean;
}

export default function MatchDetailClient({
  matchId,
  accessPrice,
  hasAccess,
  videoUrl,
  isSignedIn,
}: MatchDetailClientProps) {
  if (hasAccess) {
    return (
      <div>
        {videoUrl ? (
          <Link
            href={`/matches/${matchId}/watch`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            <Play className="h-5 w-5" />
            Watch Now
          </Link>
        ) : (
          <p className="text-gray-600">
            You have access to this match. Stream will be available at match time.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        href={isSignedIn ? `/matches/${matchId}/checkout` : "/sign-in?callbackUrl=/matches/" + matchId}
        className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        Buy This Match - ${accessPrice.toFixed(2)}
      </Link>
      <Link
        href="/subscription"
        className="inline-flex items-center justify-center px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
      >
        Subscribe & Watch All
      </Link>
    </div>
  );
}
