import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function env(key: string, fallback = ""): string {
  return (
    process.env[key] ??
    ({
      MYSQL_HOST: process.env.DB_HOST,
      MYSQL_PORT: process.env.DB_PORT,
      MYSQL_USER: process.env.DB_USER,
      MYSQL_PASSWORD: process.env.DB_PASSWORD,
      MYSQL_DATABASE: process.env.DB_NAME,
    } as Record<string, string | undefined>)[key] ??
    fallback
  );
}

export function isDbConfigured(): boolean {
  const host = env("MYSQL_HOST");
  const database = env("MYSQL_DATABASE");
  return Boolean(host && database);
}

export function getPool(): mysql.Pool {
  if (!isDbConfigured()) {
    throw new Error("Base de données non configurée. Définissez MYSQL_HOST et MYSQL_DATABASE dans .env");
  }
  if (!pool) {
    pool = mysql.createPool({
      host: env("MYSQL_HOST", "127.0.0.1"),
      port: Number(env("MYSQL_PORT", "3306")),
      user: env("MYSQL_USER", "root"),
      password: env("MYSQL_PASSWORD", ""),
      database: env("MYSQL_DATABASE", "salaichaparfumeur"),
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4",
    });
  }
  return pool;
}
