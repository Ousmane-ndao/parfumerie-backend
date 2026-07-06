export type ProductType = "Parfum" | "Diffuseur électrique" | "Appareil Doppler";
export type PerfumeFamily = "Floral" | "Boisé" | "Oriental" | "Frais";

export const productTypes: ProductType[] = ["Parfum", "Diffuseur électrique", "Appareil Doppler"];
export const perfumeFamilies: PerfumeFamily[] = ["Floral", "Boisé", "Oriental", "Frais"];

export type ProductInput = {
  ref: string;
  name: string;
  type: ProductType;
  family?: PerfumeFamily | null;
  price: number;
  image: string;
  short: string;
  description: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  contenance: string;
  concentration: string;
  available: boolean;
  featured?: boolean;
};

export type ProductWithId = ProductInput & {
  id: number;
  featured: boolean;
};

export function parseProductInput(body: unknown): ProductInput | string {
  if (!body || typeof body !== "object") return "Corps de requête invalide";
  const b = body as Record<string, unknown>;

  const ref = String(b.ref ?? "").trim();
  const name = String(b.name ?? "").trim();
  const type = String(b.type ?? "") as ProductType;
  const price = Number(b.price);
  const image = String(b.image ?? "").trim();
  const short = String(b.short ?? "").trim();
  const description = String(b.description ?? "").trim();
  const contenance = String(b.contenance ?? "").trim();
  const concentration = String(b.concentration ?? "").trim();
  const available = b.available !== false;
  const featured = Boolean(b.featured);

  if (!ref || !name || !image || !short || !description || !contenance || !concentration) {
    return "Champs obligatoires manquants";
  }
  if (!productTypes.includes(type)) return "Type de produit invalide";

  let family: PerfumeFamily | null | undefined = undefined;
  if (type === "Parfum") {
    const f = b.family ? String(b.family) : "";
    if (!f || !perfumeFamilies.includes(f as PerfumeFamily)) {
      return "Famille olfactive requise pour un parfum";
    }
    family = f as PerfumeFamily;
  } else if (b.family) {
    family = null;
  }

  if (!Number.isFinite(price) || price < 0) return "Prix invalide";

  const notesRaw = b.notes;
  if (!notesRaw || typeof notesRaw !== "object") return "Notes invalides";
  const notesObj = notesRaw as Record<string, unknown>;
  const toArray = (v: unknown) =>
    Array.isArray(v) ? v.map(String).filter(Boolean) : String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  return {
    ref,
    name,
    type,
    family,
    price: Math.round(price),
    image,
    short,
    description,
    notes: {
      top: toArray(notesObj.top),
      heart: toArray(notesObj.heart),
      base: toArray(notesObj.base),
    },
    contenance,
    concentration,
    available,
    featured,
  };
}
