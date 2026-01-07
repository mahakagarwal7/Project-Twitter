import { signup, login } from "./auth.service";
import type { Request, Response } from "express";
export async function signupHandler(req: Request, res: Response) {
    const { email, password } = req.body;
    await signup(email, password);
    res.send("User created");
}
export async function loginHandler(req: Request, res: Response) {
    const { email, password } = req.body;
    const token = await login(email, password);
    res.json({ token });
}
