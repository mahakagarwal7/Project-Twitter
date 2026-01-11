import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../crypto/jwt";
import { isTokenBlacklisted } from "../modules/auth/tokenBlacklist";
import redisClient from "../config/redis";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
if (!authHeader) {
  return res.sendStatus(401);
}

const [scheme, token] = authHeader.split(" ");
if (scheme !== "Bearer" || !token) {
  return res.sendStatus(401);
}

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.sendStatus(401);
    }

    const payload = verifyToken(token);
    const session = await redisClient.get(`session:${token}`);
    if (!session) {
  return res.sendStatus(401);
  }

    req.user = { id: payload.userId };


    next();
  } catch (error) {
    return res.sendStatus(401);
  }
}

