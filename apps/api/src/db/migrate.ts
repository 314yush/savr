import { pool } from "./client.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  const schema = await fs.readFile(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("Migration complete");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch(console.error).finally(() => pool.end());
}
