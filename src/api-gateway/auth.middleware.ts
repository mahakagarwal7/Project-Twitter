import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../crypto/jwt";
import { isTokenBlacklisted } from "../modules/auth/tokenBlacklist";

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

    const payload = verifyToken(token);
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.sendStatus(401);
    } 
    req.user = { userId: payload.userId, exp: payload.exp };
    req.token = { token, exp: payload.exp };

    next();
  } catch (err) {
    return res.sendStatus(401);
  }
}
