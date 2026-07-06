import { Pool } from "pg";

let pool: Pool | null = null;

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.startsWith("postgresql://"));
}

export function getPool(): Pool {
  if (!isDbConfigured()) {
    throw new Error(
      "Base de données non configurée. Définissez DATABASE_URL dans .env (URL PostgreSQL Neon)"
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    // Gestion d'erreur avec typage explicite
    pool.on("error", (err: Error) => {
      console.error("❌ Erreur inattendue du pool PostgreSQL :", err);
    });
  }

  return pool;
}