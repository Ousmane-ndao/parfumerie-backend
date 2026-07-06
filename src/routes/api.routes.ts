import { Router } from "express";
import multer from "multer";
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminGetProduct,
  adminListProducts,
  adminLogin,
  adminLogout,
  adminMe,
  adminUpdateProduct,
  adminUpload,
  getPublicProduct,
  getPublicProducts,
} from "../controllers/api.controller.js";
import { requireAdmin } from "../middleware/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const productsRouter = Router();
productsRouter.get("/", getPublicProducts);
productsRouter.get("/:ref", getPublicProduct);

export const adminRouter = Router();
adminRouter.post("/login", adminLogin);
adminRouter.post("/logout", adminLogout);
adminRouter.get("/me", adminMe);

adminRouter.get("/products", requireAdmin, adminListProducts);
adminRouter.post("/products", requireAdmin, adminCreateProduct);
adminRouter.get("/products/:id", requireAdmin, adminGetProduct);
adminRouter.put("/products/:id", requireAdmin, adminUpdateProduct);
adminRouter.delete("/products/:id", requireAdmin, adminDeleteProduct);

export const uploadRouter = Router();
uploadRouter.post("/", requireAdmin, upload.single("file"), adminUpload);
