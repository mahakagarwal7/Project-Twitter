// src/index.ts
import { app } from "./app";
import redisClient, { connectRedis } from "./config/redis";

const PORT = 3000;

(async () => {
  try {
    await connectRedis();
    // await redisClient.set("health", "ok");
    // console.log("Redis health:", await redisClient.get("health")); 
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
})();
