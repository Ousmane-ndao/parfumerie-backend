import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(
  __dirname,
  "../../",
  process.env.UPLOAD_DIR?.trim() || "uploads",
  "products",
);

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function saveUploadedImage(file: Express.Multer.File): Promise<string> {
  if (!ALLOWED.has(file.mimetype)) {
    throw new Error("Format image non supporté (jpg, png, webp, gif)");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Fichier trop volumineux (max 5 Mo)");
  }

  const ext =
    file.mimetype === "image/jpeg"
      ? ".jpg"
      : file.mimetype === "image/png"
        ? ".png"
        : file.mimetype === "image/webp"
          ? ".webp"
          : ".gif";

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

  return `/uploads/products/${filename}`;
}

export function getUploadsRoot(): string {
  return path.resolve(__dirname, "../../", process.env.UPLOAD_DIR?.trim() || "uploads");
}
