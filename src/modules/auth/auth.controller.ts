import { signup, login } from "./auth.service";
import type { Request, Response } from "express";
import { deleteSession } from "../sessions/session.repo";
import { changePassword } from "./password-change.service";
import { PasswordPolicyError } from "./password.policy";
import { blacklistToken } from "./tokenBlacklist";
import { verifyToken } from "../../crypto/jwt";



export async function signupHandler(req:Request, res: Response) {
  try {
    await signup(req.body.email, req.body.password);
    res.status(201).json({ message: "User created" });
  } catch (err) {
    if (err instanceof PasswordPolicyError) {
      return res.status(400).json({ error: err.message });
    }

   
    return res.status(500).json({ error: "Internal server error" });
  }
}
export async function loginHandler(req: Request, res: Response) {
    const { email, password } = req.body;
    const accessToken = await login(email, password);
    res.cookie("accesstoken", accessToken, { httpOnly: true, secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 });
    res.json({
      accessToken,
    });
}

export async function logoutHandler(req: Request, res: Response) {
  if (!req.user || !req.token) {
    return res.sendStatus(401);
  }
  const { token, exp } = req.token;
  await blacklistToken(token, exp);
  await deleteSession(token);
  res.json({ message: "Logged out" });
}
export async function changePasswordHandler(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }

    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    await changePassword(userId, oldPassword, newPassword);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    if (err instanceof PasswordPolicyError) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  }
}