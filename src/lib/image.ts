/** Utilidades de imagen en el navegador (sin dependencias). */

const MAX_SVG_BYTES = 200 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un logo subido en un data URL ligero: los SVG se guardan tal
 * cual (si son pequeños) y el resto se reduce a `maxSize` px en PNG, que
 * conserva la transparencia típica de los logos.
 */
export async function logoToDataUrl(file: File, maxSize = 320): Promise<string> {
  if (file.type === "image/svg+xml") {
    if (file.size > MAX_SVG_BYTES) throw new Error("El SVG es demasiado pesado (máx. 200 KB).");
    return readAsDataUrl(file);
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Sube una imagen PNG, JPG, WEBP o SVG.");
  }

  const source = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("La imagen no se pudo abrir."));
    el.src = source;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no permite procesar la imagen.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/**
 * Color dominante de un logo (data URL) para proponerlo como acento de la
 * banda. Reduce la imagen a 48 px y descarta fondo, trazo y grises.
 */
export async function logoAccentColor(dataUrl: string): Promise<string | null> {
  const { dominantColor } = await import("@/lib/brand-color");
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("La imagen no se pudo abrir."));
    el.src = dataUrl;
  });
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  return dominantColor(ctx.getImageData(0, 0, size, size).data);
}
