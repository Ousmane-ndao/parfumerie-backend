import type { Request, Response, NextFunction } from "express";
import { extractBearerToken, verifyAdminToken } from "../services/auth.service.js";
import { unauthorized } from "../utils/http.js";

export type AuthedRequest = Request & { admin?: { id: number; email: string } };

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return unauthorized(res);

  const admin = verifyAdminToken(token);
  if (!admin) return unauthorized(res);

  req.admin = admin;
  next();
}
