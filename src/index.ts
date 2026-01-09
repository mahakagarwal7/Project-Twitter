import "dotenv/config";
import { app } from "./app";
import { connectRedis } from "./config/redis";
import { pg } from "./db/postgres";

const PORT = 3000;

(async () => {
  try {
    // 🔎 TEMP DB CHECK
    await pg.query("SELECT 1");
    console.log("DB connected");
    
    // Redis
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();
