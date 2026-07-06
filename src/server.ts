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
// 👇 Nouveaux imports pour l'authentification
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "./database/pool.js";

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

// 👇 Route de connexion admin (AJOUT)
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const pool = getPool();
    const result = await pool.query(
      "SELECT id, email, password_hash FROM admins WHERE email = $1 LIMIT 1",
      [email.toLowerCase().trim()]
    );

    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET || "super_secret_key_change_this_in_production",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Gestion des routes non trouvées (404)
app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// Gestion des erreurs serveur (500)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur interne" });
});

app.listen(PORT, () => {
  console.log(`API Parfumerie — http://localhost:${PORT}`);
  console.log(`Uploads — http://localhost:${PORT}/uploads`);
});