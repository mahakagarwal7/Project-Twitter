import redisClient from "../../config/redis";

export async function blacklistToken(token: string, exp: number) {
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redisClient.setEx(`bl:${token}`, ttl, "1");
  }
}

export async function isTokenBlacklisted(token: string) {
  return await redisClient.exists(`bl:${token}`);
}
