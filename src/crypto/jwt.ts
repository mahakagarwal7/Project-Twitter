import jwt from "jsonwebtoken";
const SECRET = "dev-secret"; //hardcoded 
export function createToken(userId: number) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "1h" });
}
export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as { userId: number };
}
