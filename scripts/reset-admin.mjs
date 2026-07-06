import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  const email = (process.env.ADMIN_EMAIL ?? "admin@salaicha.sn").toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    console.error("ADMIN_PASSWORD manquant dans .env");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "salaichaparfumeur",
  });

  await conn.query(
    `INSERT INTO admins (email, password_hash) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [email, hash],
  );

  console.log(`Mot de passe admin mis à jour pour : ${email}`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
