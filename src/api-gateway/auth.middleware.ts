import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../crypto/jwt";
import { isTokenBlacklisted } from "../modules/auth/tokenBlacklist";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.sendStatus(401);
    }

    const token = auth.split(" ")[1];
    if (!token) {
      return res.sendStatus(401);
    }

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.sendStatus(401);
    }

    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch (error) {
    return res.sendStatus(401);
  }
}

