import jwt from "jsonwebtoken";
const SECRET = "dev-secret"; //hardcoded 

export type JwtPayload = { userId: number; exp: number };

export function createToken(userId: number) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "15m" });
}
export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as JwtPayload;
}
