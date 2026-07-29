/**
 * Genera los recursos de marca en public/brand a partir de los fragmentos
 * base64 versionados en scripts/brand/. Se ejecuta en postinstall (local, CI
 * y Vercel), antes de `next build`, por lo que las imágenes quedan integradas
 * como estáticos del despliegue sin depender de terceros.
 *
 * Nunca rompe la instalación: si algo falla, avisa y continúa.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandSrc = path.join(__dirname, "brand");
const brandOut = path.join(__dirname, "..", "public", "brand");

const assets = [
  { prefix: "logo-hero.b64.", file: "logo-hero.webp", type: "webp" },
  { prefix: "nfp-seal-paper.b64.", file: "nfp-seal-paper.png", type: "png" },
];

function isValid(buf, type) {
  if (type === "webp") {
    return (
      buf.length > 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    );
  }
  // PNG: 8-byte signature
  return (
    buf.length > 8 &&
    buf[0] === 0x89 &&
    buf.toString("ascii", 1, 4) === "PNG"
  );
}

try {
  mkdirSync(brandOut, { recursive: true });
  const all = readdirSync(brandSrc);

  for (const asset of assets) {
    try {
      const dest = path.join(brandOut, asset.file);
      if (existsSync(dest) && isValid(readFileSync(dest), asset.type)) {
        console.log(`[brand] ${asset.file} ya existe y es válido.`);
        continue;
      }
      const parts = all.filter((f) => f.startsWith(asset.prefix)).sort();
      if (parts.length === 0) throw new Error(`sin fragmentos para ${asset.file}`);
      const b64 = parts
        .map((f) => readFileSync(path.join(brandSrc, f), "utf8"))
        .join("")
        .replace(/\s+/g, "");
      const buf = Buffer.from(b64, "base64");
      if (!isValid(buf, asset.type)) throw new Error(`${asset.file} no supera la validación`);
      writeFileSync(dest, buf);
      console.log(`[brand] ${asset.file} generado (${buf.length} bytes).`);
    } catch (err) {
      console.warn(`[brand] Aviso en ${asset.file}: ${err.message}`);
    }
  }
} catch (err) {
  console.warn(`[brand] Aviso: ${err.message}. La app usará respaldos visuales.`);
}
process.exit(0);
