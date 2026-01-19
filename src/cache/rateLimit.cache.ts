import { redis } from "./redis.client";

export class RateLimitCache {
    static async increment(key: string, windowSeconds: number) {
    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, windowSeconds);
    }

    return count;
    }

    static async ttl(key: string) {
    return redis.ttl(key);
    }
}
