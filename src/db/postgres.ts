import { Pool } from "pg";

export const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
});


