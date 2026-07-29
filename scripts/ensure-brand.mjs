/**
 * Descarga los recursos de marca (logo-hero) en public/brand si no existen.
 * Se ejecuta en postinstall (local, CI y Vercel), antes de `next build`,
 * por lo que las imágenes quedan integradas como estáticos del despliegue.
 *
 * Nunca rompe la instalación: si la descarga falla, avisa y continúa.
 */
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandDir = path.join(__dirname, "..", "public", "brand");

const assets = [
  {
    url: "https://n.uguu.se/wCLzlkzE.webp",
    file: "logo-hero.webp",
  },
  {
    url: "https://n.uguu.se/ZYlVNUvX.webp",
    file: "logo-hero-sm.webp",
  },
];

async function isValidWebp(filePath) {
  try {
    const buf = await readFile(filePath);
    return (
      buf.length > 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    );
  } catch {
    return false;
  }
}

async function download(url, dest) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  await new Promise((resolve, reject) => {
    const stream = createWriteStream(dest);
    res.body.pipeTo(
      new WritableStream({
        write: (chunk) => stream.write(Buffer.from(chunk)),
        close: () => {
          stream.end();
          resolve();
        },
        abort: reject,
      }),
    ).catch(reject);
  });
}

mkdirSync(brandDir, { recursive: true });

for (const asset of assets) {
  const dest = path.join(brandDir, asset.file);
  if (existsSync(dest) && (await isValidWebp(dest))) {
    console.log(`[brand] ${asset.file} ya existe, se omite.`);
    continue;
  }
  try {
    await download(asset.url, dest);
    if (!(await isValidWebp(dest))) throw new Error("contenido no WebP");
    console.log(`[brand] ${asset.file} descargado.`);
  } catch (error) {
    console.warn(
      `[brand] No se pudo descargar ${asset.file} (${error.message}). ` +
        "La app funciona sin él; súbelo manualmente a public/brand/ cuando puedas.",
    );
  }
}

process.exit(0);
