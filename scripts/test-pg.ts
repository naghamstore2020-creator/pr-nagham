import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool
  .query("SELECT 1")
  .then((r) => {
    console.log("pg OK:", r.rows);
    process.exit(0);
  })
  .catch((e) => {
    console.error("pg Error:", e.message);
    process.exit(1);
  });
