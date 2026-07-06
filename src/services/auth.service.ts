import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findAdminByEmail } from "../database/products-repo.js";

export type AdminPayload = { id: number; email: string };

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET requis en production");
    }
    return "dev-jwt-secret-change-me";
  }
  return secret;
}

export async function verifyAdminPassword(email: string, password: string): Promise<AdminPayload | null> {
  const admin = await findAdminByEmail(email);
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return null;
  return { id: admin.id, email: admin.email };
}

export function signAdminToken(admin: AdminPayload): string {
  return jwt.sign({ sub: admin.id, email: admin.email }, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (typeof payload.sub !== "number" || typeof payload.email !== "string") return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}
