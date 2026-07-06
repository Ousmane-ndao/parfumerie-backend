import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { copyFile, mkdir } from "node:fs/promises";

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

function parseFallbackProducts() {
  const fallbackPath = path.join(root, "../frontend/src/lib/fallback-products.ts");
  const src = fs.readFileSync(fallbackPath, "utf8");
  const importMap = {};
  for (const m of src.matchAll(/import (\w+) from "@\/assets\/([^"]+)"/g)) {
    importMap[m[1]] = path.basename(m[2]);
  }
  const start = src.indexOf("export const fallbackProducts");
  const arrStart = src.indexOf("[", start);
  let depth = 0;
  let arrEnd = -1;
  for (let i = arrStart; i < src.length; i++) {
    if (src[i] === "[") depth++;
    if (src[i] === "]") {
      depth--;
      if (depth === 0) {
        arrEnd = i + 1;
        break;
      }
    }
  }
  let body = src.slice(arrStart, arrEnd);
  for (const [varName, file] of Object.entries(importMap)) {
    body = body.replaceAll(`image: ${varName},`, `image: "/uploads/products/${file}",`);
  }
  // eslint-disable-next-line no-new-func
  return new Function(`return ${body}`)();
}

async function copyImages(products) {
  const destDir = path.join(root, "public/uploads/products");
  await mkdir(destDir, { recursive: true });
  const copied = new Set();
  for (const p of products) {
    const filename = path.basename(p.image);
    if (copied.has(filename)) continue;
    copied.add(filename);
    const srcFile = path.join(root, "src/assets", filename);
    if (fs.existsSync(srcFile)) {
      await copyFile(srcFile, path.join(destDir, filename));
    }
  }
}

async function main() {
  loadEnv();
  const products = parseFallbackProducts();
  await copyImages(products);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(root, "database/schema.sql"), "utf8");
  await conn.query(schema);

  await conn.changeUser({ database: process.env.DB_NAME ?? "salaichaparfumeur" });

  const email = (process.env.ADMIN_EMAIL ?? "admin@salaicha.sn").toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    console.error("ADMIN_PASSWORD manquant dans .env — définissez un mot de passe avant le seed.");
    process.exit(1);
  }
  const [admins] = await conn.query("SELECT id FROM admins WHERE email = ? LIMIT 1", [email]);
  if (admins.length === 0) {
    const hash = await bcrypt.hash(password, 12);
    await conn.query("INSERT INTO admins (email, password_hash) VALUES (?, ?)", [email, hash]);
    console.log(`Admin créé : ${email}`);
  } else {
    console.log(`Admin existant : ${email}`);
  }

  for (const p of products) {
    await conn.query(
      `INSERT INTO products (
        ref, name, type, family, price, image, short_description, description,
        notes_top, notes_heart, notes_base, contenance, concentration, available, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name=VALUES(name), type=VALUES(type), family=VALUES(family), price=VALUES(price),
        image=VALUES(image), short_description=VALUES(short_description), description=VALUES(description),
        notes_top=VALUES(notes_top), notes_heart=VALUES(notes_heart), notes_base=VALUES(notes_base),
        contenance=VALUES(contenance), concentration=VALUES(concentration),
        available=VALUES(available), featured=VALUES(featured)`,
      [
        p.ref,
        p.name,
        p.type,
        p.family ?? null,
        p.price,
        p.image,
        p.short,
        p.description,
        JSON.stringify(p.notes.top),
        JSON.stringify(p.notes.heart),
        JSON.stringify(p.notes.base),
        p.contenance,
        p.concentration,
        p.available ? 1 : 0,
        p.featured ? 1 : 0,
      ],
    );
  }

  console.log(`${products.length} produits importés dans salaichaparfumeur`);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
