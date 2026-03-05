import { NextRequest, NextResponse } from "next/server";

type Key = string;

type Bucket = {
  windowStart: number;
  count: number;
};

// Simple in-memory sliding window limiter (per process).
// Good enough for basic protection; for production-grade, back with Redis or similar.
const buckets = new Map<Key, Bucket>();

type Options = {
  limit: number;
  windowMs: number;
};

const DEFAULTS: Options = {
  limit: 10,
  windowMs: 60_000, // 1 minute
};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return req.ip ?? "unknown";
}

export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  keyPrefix: string,
  options?: Partial<Options>
): Promise<NextResponse> {
  const { limit, windowMs } = { ...DEFAULTS, ...options };
  const ip = getClientIp(req);
  const key: Key = `${keyPrefix}:${ip}`;

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
  } else {
    bucket.count += 1;
    if (bucket.count > limit) {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }
  }

  return handler(req);
}

