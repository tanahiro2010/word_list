const ipBuckets = new Map<string, number[]>();
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

export const ABUSE_PROTECTION = {
  maxTrackedBuckets: 5000,
  bucketRetentionMs: 60 * MINUTE_MS,
  requestSizeLimit: {
    createDeckBytes: 10_000,
    publishDeckBytes: 100_000,
  },
  rateLimit: {
    createDeck: {
      burst: { key: "create-deck-burst", limit: 5, windowMs: 30 * SECOND_MS },
      sustained: { key: "create-deck-sustained", limit: 20, windowMs: 10 * MINUTE_MS },
    },
    publishDeck: {
      burst: { key: "publish-deck-burst", limit: 5, windowMs: 20 * SECOND_MS },
      sustained: { key: "publish-deck-sustained", limit: 40, windowMs: 10 * MINUTE_MS },
    },
  },
  blockedFragments: ["discord.gg/", "t.me/", "line.me/", "bit.ly/", "tinyurl.com/", "is.gd/"],
  minRetryAfterSec: 1,
} as const;

type RateLimitResult = {
  ok: boolean;
  retryAfterSec: number;
};

type RateLimitInput = {
  request: Request;
  key: string;
  limit: number;
  windowMs: number;
};

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return "unknown";
}

export function checkRateLimit({ request, key, limit, windowMs }: RateLimitInput): RateLimitResult {
  const ip = getClientIp(request);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const recent = (ipBuckets.get(bucketKey) ?? []).filter((timestamp) => timestamp > windowStart);
  if (recent.length >= limit) {
    const oldestInWindow = recent[0] ?? now;
    const retryAfterMs = Math.max(0, oldestInWindow + windowMs - now);
    return {
      ok: false,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  recent.push(now);
  ipBuckets.set(bucketKey, recent);

  if (ipBuckets.size > ABUSE_PROTECTION.maxTrackedBuckets) {
    for (const [storedKey, timestamps] of ipBuckets.entries()) {
      const cleaned = timestamps.filter(
        (timestamp) => timestamp > now - ABUSE_PROTECTION.bucketRetentionMs,
      );
      if (cleaned.length === 0) {
        ipBuckets.delete(storedKey);
      } else {
        ipBuckets.set(storedKey, cleaned);
      }
    }
  }

  return { ok: true, retryAfterSec: 0 };
}

export function containsBlockedContent(text: string): boolean {
  const normalized = text.toLowerCase();
  return ABUSE_PROTECTION.blockedFragments.some((fragment) => normalized.includes(fragment));
}

export function responseTooManyRequests(retryAfterSec: number): Response {
  const safeRetry = Math.max(ABUSE_PROTECTION.minRetryAfterSec, retryAfterSec);
  return Response.json(
    { error: `操作が多すぎます。${safeRetry}秒後に再試行してください。` },
    {
      status: 429,
      headers: {
        "Retry-After": String(safeRetry),
      },
    },
  );
}
