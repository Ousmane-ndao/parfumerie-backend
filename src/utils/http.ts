import type { Response } from "express";

export function sendJson(res: Response, data: unknown, status = 200) {
  return res.status(status).json(data);
}

export function unauthorized(res: Response, message = "Non autorisé") {
  return sendJson(res, { error: message }, 401);
}

export function badRequest(res: Response, message: string) {
  return sendJson(res, { error: message }, 400);
}

export function notFound(res: Response, message = "Ressource introuvable") {
  return sendJson(res, { error: message }, 404);
}

export function serviceUnavailable(res: Response, message: string) {
  return sendJson(res, { error: message }, 503);
}

export function tooManyRequests(res: Response, message: string, retryAfterSec?: number) {
  if (retryAfterSec != null) res.setHeader("Retry-After", String(retryAfterSec));
  return sendJson(res, { error: message }, 429);
}
