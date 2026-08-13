import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const buckets = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (entry.resetTime < now) {
      buckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, max, keyFn } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyFn
      ? keyFn(req)
      : (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || entry.resetTime < now) {
      buckets.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    entry.count++;
    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

    if (entry.count > max) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyFn: (req) => {
    const authHeader = req.headers.authorization;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    return authHeader ? `user:${authHeader.substring(7, 20)}` : `ip:${ip}`;
  },
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyFn: (req) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  },
});
