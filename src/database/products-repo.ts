import { getPool } from "./pool.js";
import type { PerfumeFamily, ProductInput, ProductType, ProductWithId } from "../utils/product-validation.js";

type ProductRow = {
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
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "SELECT * FROM products ORDER BY type, name"
  );
  return result.rows.map(rowToProduct);
}

export async function getProductByRef(ref: string): Promise<ProductWithId | null> {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "SELECT * FROM products WHERE ref = $1 LIMIT 1",
    [ref]
  );
  return result.rows[0] ? rowToProduct(result.rows[0]) : null;
}

export async function getProductById(id: number): Promise<ProductWithId | null> {
  const pool = getPool();
  const result = await pool.query<ProductRow>(
    "SELECT * FROM products WHERE id = $1 LIMIT 1",
    [id]
  );
  return result.rows[0] ? rowToProduct(result.rows[0]) : null;
}

async function countProductsByType(type: ProductType): Promise<number> {
  const pool = getPool();
  const result = await pool.query<{ c: number }>(
    "SELECT COUNT(*) AS c FROM products WHERE type = $1",
    [type]
  );
  return result.rows[0]?.c ?? 0;
}

export async function createProduct(input: ProductInput): Promise<ProductWithId> {
  const pool = getPool();
  let ref = input.ref?.trim();

  if (!ref) {
    const count = await countProductsByType(input.type);
    ref = `SAL-${input.type.toUpperCase().slice(0, 3)}-${String(count + 1).padStart(3, "0")}`;
  }

  // Vérifier l'unicité de la référence
  const existing = await pool.query<{ id: number }>(
    "SELECT id FROM products WHERE ref = $1",
    [ref]
  );
  if (existing.rows.length > 0) {
    ref = `SAL-${input.type.toUpperCase().slice(0, 3)}-${Date.now()}`;
  }

  const insertResult = await pool.query<{ id: number }>(
    `INSERT INTO products (
      ref, name, type, family, price, image, short_description, description,
      notes_top, notes_heart, notes_base, contenance, concentration, available, featured
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
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
    ]
  );

  const newId = insertResult.rows[0].id;
  const created = await getProductById(newId);
  if (!created) throw new Error("Produit non créé");
  return created;
}

export async function updateProduct(id: number, input: ProductInput): Promise<ProductWithId> {
  const pool = getPool();
  let ref = input.ref?.trim();
  if (!ref) {
    const count = await countProductsByType(input.type);
    ref = `SAL-${input.type.toUpperCase().slice(0, 3)}-${count + 1}`;
  }

  await pool.query(
    `UPDATE products SET
      ref = $1, name = $2, type = $3, family = $4, price = $5, image = $6,
      short_description = $7, description = $8,
      notes_top = $9, notes_heart = $10, notes_base = $11,
      contenance = $12, concentration = $13, available = $14, featured = $15
     WHERE id = $16`,
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
    ]
  );

  const updated = await getProductById(id);
  if (!updated) throw new Error("Produit introuvable");
  return updated;
}

export async function deleteProduct(id: number): Promise<void> {
  const pool = getPool();
  await pool.query("DELETE FROM products WHERE id = $1", [id]);
}

export async function findAdminByEmail(email: string) {
  const pool = getPool();
  const result = await pool.query<{ id: number; email: string; password_hash: string }>(
    "SELECT id, email, password_hash FROM admins WHERE email = $1 LIMIT 1",
    [email.toLowerCase().trim()]
  );
  return result.rows[0] ?? null;
}