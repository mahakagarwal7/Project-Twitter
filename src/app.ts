import express from "express";
import routes from "./routes";

export const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Backend is running");
});

app.use(routes);
