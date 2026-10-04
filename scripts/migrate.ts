/** Aplica db/migrations/*.sql em ordem, uma única vez cada. Uso: npm run db:migrate */
import "./env";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

export async function migrate(databaseUrl: string, quiet = false) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock(777001)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const dir = path.join(__dirname, "..", "db", "migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    for (const f of files) {
      const done = await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [f]);
      if (done.rowCount) continue;
      await client.query("BEGIN");
      await client.query(fs.readFileSync(path.join(dir, f), "utf8"));
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [f]);
      await client.query("COMMIT");
      if (!quiet) console.log(`✓ ${f}`);
    }
    if (!quiet) console.log("Migrações em dia.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.query("SELECT pg_advisory_unlock(777001)").catch(() => {});
    await client.end();
  }
}

if (require.main === module) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL não configurada.");
    process.exit(1);
  }
  migrate(url).catch((err) => {
    console.error("Falha na migração:", err.message);
    process.exit(1);
  });
}
