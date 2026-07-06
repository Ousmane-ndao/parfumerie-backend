import fs from "node:fs";

const orig = fs.readFileSync("src/lib/products.ts", "utf8");
const importEnd = orig.indexOf("export const productTypes");
const imports = orig.slice(0, importEnd).trim();
const arrayMatch = orig.match(/export const products: Product\[\] = \[[\s\S]*?\n\];/);
if (!arrayMatch) throw new Error("array not found");
const fallback =
  imports +
  '\nimport type { Product } from "./products";\n\n' +
  arrayMatch[0].replace("export const products", "export const fallbackProducts") +
  "\n";
fs.writeFileSync("src/lib/fallback-products.ts", fallback, "utf8");
console.log("fallback-products.ts written");
