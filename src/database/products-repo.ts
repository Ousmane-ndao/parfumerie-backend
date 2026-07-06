import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { getPool } from "./pool.js";
import type { PerfumeFamily, ProductInput, ProductType, ProductWithId } from "../utils/product-validation.js";

type ProductRow = RowDataPacket & {
  id: number;
  ref: string;
  name: string;
  type: ProductType;
  family: PerfumeFamily | null;
  price: number;
  image: string;
  short_description: string;
  description: string;
  notes_top: string;
  notes_heart: string;
  notes_base: string;
  contenance: string;
  concentration: string;
  available: number;
  featured: number;
};

function safeJsonParse(value: string | null | undefined): string[] {
  try {
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToProduct(row: ProductRow): ProductWithId {
  return {
    id: row.id,
    ref: row.ref,
    name: row.name,
    type: row.type,
    family: row.family ?? undefined,
    price: row.price,
    image: row.image,
    short: row.short_description,
    description: row.description,
    notes: {
      top: safeJsonParse(row.notes_top),
      heart: safeJsonParse(row.notes_heart),
      base: safeJsonParse(row.notes_base),
    },
    contenance: row.contenance,
    concentration: row.concentration,
    available: Boolean(row.available),
    featured: Boolean(row.featured),
  };
}

export async function listProducts(): Promise<ProductWithId[]> {
  const [rows] = await getPool().query<ProductRow[]>("SELECT * FROM products ORDER BY type, name");
  return rows.map(rowToProduct);
}

export async function getProductByRef(ref: string): Promise<ProductWithId | null> {
  const [rows] = await getPool().query<ProductRow[]>("SELECT * FROM products WHERE ref = ? LIMIT 1", [ref]);
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function getProductById(id: number): Promise<ProductWithId | null> {
  const [rows] = await getPool().query<ProductRow[]>("SELECT * FROM products WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? rowToProduct(rows[0]) : null;
}

async function countProductsByType(type: ProductType): Promise<number> {
  const [rows] = await getPool().query<(RowDataPacket & { c: number })[]>(
    "SELECT COUNT(*) AS c FROM products WHERE type = ?",
    [type],
  );
  return rows[0]?.c ?? 0;
}

export async function createProduct(input: ProductInput): Promise<ProductWithId> {
  const pool = getPool();
  let ref = input.ref?.trim();

  if (!ref) {
    const count = await countProductsByType(input.type);
    ref = `SAL-${input.type.toUpperCase().slice(0, 3)}-${String(count + 1).padStart(3, "0")}`;
  }

  const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM products WHERE ref = ?", [ref]);
  if (existing.length > 0) {
    ref = `SAL-${input.type.toUpperCase().slice(0, 3)}-${Date.now()}`;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO products (
      ref, name, type, family, price, image, short_description, description,
      notes_top, notes_heart, notes_base, contenance, concentration, available, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ref,
      input.name,
      input.type,
      input.family ?? null,
      input.price,
      input.image,
      input.short,
      input.description,
      JSON.stringify(input.notes?.top ?? []),
      JSON.stringify(input.notes?.heart ?? []),
      JSON.stringify(input.notes?.base ?? []),
      input.contenance,
      input.concentration,
      input.available ? 1 : 0,
      input.featured ? 1 : 0,
    ],
  );

  const created = await getProductById(result.insertId);
  if (!created) throw new Error("Produit non créé");
  return created;
}

export async function updateProduct(id: number, input: ProductInput): Promise<ProductWithId> {
  let ref = input.ref?.trim();
  if (!ref) {
    const count = await countProductsByType(input.type);
    ref = `SAL-${input.type.toUpperCase().slice(0, 3)}-${count + 1}`;
  }

  await getPool().query(
    `UPDATE products SET
      ref = ?, name = ?, type = ?, family = ?, price = ?, image = ?,
      short_description = ?, description = ?,
      notes_top = ?, notes_heart = ?, notes_base = ?,
      contenance = ?, concentration = ?, available = ?, featured = ?
     WHERE id = ?`,
    [
      ref,
      input.name,
      input.type,
      input.family ?? null,
      input.price,
      input.image,
      input.short,
      input.description,
      JSON.stringify(input.notes?.top ?? []),
      JSON.stringify(input.notes?.heart ?? []),
      JSON.stringify(input.notes?.base ?? []),
      input.contenance,
      input.concentration,
      input.available ? 1 : 0,
      input.featured ? 1 : 0,
      id,
    ],
  );

  const updated = await getProductById(id);
  if (!updated) throw new Error("Produit introuvable");
  return updated;
}

export async function deleteProduct(id: number) {
  await getPool().query("DELETE FROM products WHERE id = ?", [id]);
}

export async function findAdminByEmail(email: string) {
  const [rows] = await getPool().query<(RowDataPacket & { id: number; email: string; password_hash: string })[]>(
    "SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1",
    [email.toLowerCase().trim()],
  );
  return rows[0] ?? null;
}
