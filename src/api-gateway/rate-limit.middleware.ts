import { Request, Response, NextFunction } from "express";
import { RateLimitCache } from "../cache/rateLimit.cache";

interface RateLimitOptions {
    limit: number;
    windowSeconds: number;
    key: (req: Request) => string;
}

export function accountRateLimit(options: RateLimitOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
    const redisKey = options.key(req);

    const count = await RateLimitCache.increment(
        redisKey,
        options.windowSeconds
    );

    if (count > options.limit) {
        const retryAfter = await RateLimitCache.ttl(redisKey);

        return res.status(429).json({
        error: "Too many requests",
        retryAfter,
        });
    }

    next();
    };
}
