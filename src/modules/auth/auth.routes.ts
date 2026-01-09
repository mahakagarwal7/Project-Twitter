import { Router } from "express";
import { signupHandler, loginHandler, logoutHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/signup", signupHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/logout", logoutHandler);

export default authRouter;
