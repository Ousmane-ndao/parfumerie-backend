import "dotenv/config";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adminRouter, productsRouter, uploadRouter } from "./routes/api.routes.js";
import { getUploadsRoot } from "./services/upload.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 5000);
const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:5173";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: [frontendOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.use("/uploads", express.static(getUploadsRoot()));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/products", productsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur interne" });
});

app.listen(PORT, () => {
  console.log(`API Parfumerie — http://localhost:${PORT}`);
  console.log(`Uploads — http://localhost:${PORT}/uploads`);
});
