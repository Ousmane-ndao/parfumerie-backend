import type { Request, Response } from "express";
import { isDbConfigured } from "../database/pool.js";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductByRef,
  listProducts,
  updateProduct,
} from "../database/products-repo.js";
import { verifyAdminPassword, signAdminToken, verifyAdminToken, extractBearerToken } from "../services/auth.service.js";
import { saveUploadedImage } from "../services/upload.service.js";
import { badRequest, notFound, sendJson, serviceUnavailable, tooManyRequests, unauthorized } from "../utils/http.js";
import { parseProductInput } from "../utils/product-validation.js";
import { checkRateLimit, getClientIp } from "../utils/rate-limit.js";

function ensureDb(res: Response): boolean {
  if (!isDbConfigured()) {
    serviceUnavailable(res, "Base de données non configurée. Ajoutez MYSQL_HOST et MYSQL_DATABASE dans .env");
    return false;
  }
  return true;
}

export async function getPublicProducts(_req: Request, res: Response) {
  if (!ensureDb(res)) return;
  try {
    return sendJson(res, await listProducts());
  } catch (error) {
    console.error(error);
    return serviceUnavailable(res, "Erreur chargement produits");
  }
}

export async function getPublicProduct(req: Request, res: Response) {
  if (!ensureDb(res)) return;
  try {
    const product = await getProductByRef(req.params.ref);
    if (!product) return notFound(res, "Produit introuvable");
    return sendJson(res, product);
  } catch (error) {
    console.error(error);
    return serviceUnavailable(res, "Erreur chargement produit");
  }
}

export async function adminLogin(req: Request, res: Response) {
  if (!ensureDb(res)) return;

  const email = String(req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");
  if (!email || !password) return badRequest(res, "Email et mot de passe requis");

  const ip = getClientIp(req);
  const limit = checkRateLimit(`login:${ip}:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(res, "Trop de tentatives. Réessayez dans quelques minutes.", limit.retryAfterSec);
  }

  const admin = await verifyAdminPassword(email, password);
  if (!admin) return unauthorized(res, "Identifiants incorrects");

  const token = signAdminToken(admin);
  return sendJson(res, { ok: true, email: admin.email, id: admin.id, token });
}

export async function adminLogout(_req: Request, res: Response) {
  return sendJson(res, { ok: true });
}

export async function adminMe(req: Request, res: Response) {
  if (!ensureDb(res)) return;
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return unauthorized(res);
  const admin = verifyAdminToken(token);
  if (!admin) return unauthorized(res);
  return sendJson(res, { email: admin.email, id: admin.id });
}

export async function adminListProducts(_req: Request, res: Response) {
  if (!ensureDb(res)) return;
  return sendJson(res, await listProducts());
}

export async function adminGetProduct(req: Request, res: Response) {
  if (!ensureDb(res)) return;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return badRequest(res, "ID invalide");
  const product = await getProductById(id);
  if (!product) return notFound(res, "Produit introuvable");
  return sendJson(res, product);
}

export async function adminCreateProduct(req: Request, res: Response) {
  if (!ensureDb(res)) return;

  if (Array.isArray(req.body)) {
    const created = [];
    for (const item of req.body) {
      const parsed = parseProductInput(item);
      if (typeof parsed === "string") return badRequest(res, parsed);
      created.push(await createProduct(parsed));
    }
    return sendJson(res, { imported: created.length, products: created }, 201);
  }

  const parsed = parseProductInput(req.body);
  if (typeof parsed === "string") return badRequest(res, parsed);
  return sendJson(res, await createProduct(parsed), 201);
}

export async function adminUpdateProduct(req: Request, res: Response) {
  if (!ensureDb(res)) return;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return badRequest(res, "ID invalide");
  const parsed = parseProductInput(req.body);
  if (typeof parsed === "string") return badRequest(res, parsed);
  return sendJson(res, await updateProduct(id, parsed));
}

export async function adminDeleteProduct(req: Request, res: Response) {
  if (!ensureDb(res)) return;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return badRequest(res, "ID invalide");
  await deleteProduct(id);
  return sendJson(res, { ok: true });
}

export async function adminUpload(req: Request, res: Response) {
  const file = req.file;
  if (!file) return badRequest(res, "Fichier manquant");
  try {
    const url = await saveUploadedImage(file);
    return sendJson(res, { url });
  } catch (error) {
    return badRequest(res, error instanceof Error ? error.message : "Upload échoué");
  }
}
