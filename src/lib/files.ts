import { mkdir, writeFile, readFile, unlink, stat } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { del, get, head } from "@vercel/blob";
import { AppError } from "@/lib/errors";

const DEFAULT_UPLOAD_DIR = "./uploads";
const DEFAULT_MAX_SIZE_MB = 10;

/** Prefijo de storagePath para archivos guardados en Vercel Blob (privado). */
const BLOB_PREFIX = "blob:";

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

/**
 * Con un almacén Vercel Blob conectado (BLOB_STORE_ID con OIDC, o el
 * BLOB_READ_WRITE_TOKEN clásico) los archivos van a Blob y el navegador los
 * sube directamente; sin él, al disco local (desarrollo).
 */
export function isBlobStorage(): boolean {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

/** Carpeta de una sala dentro del almacén: nadie sube fuera de la suya. */
export function bandStoragePrefix(bandId: string): string {
  return `bands/${bandId}/`;
}

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR;
}

export function getMaxFileSizeBytes(): number {
  const maxMb = Number(process.env.MAX_FILE_SIZE_MB ?? DEFAULT_MAX_SIZE_MB);
  return maxMb * 1024 * 1024;
}

export function validateMimeType(mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError(
      "Tipo de archivo no permitido.",
      "INVALID_MIME_TYPE",
      400,
    );
  }
}

export function validateFileSize(sizeBytes: number): void {
  const maxSize = getMaxFileSizeBytes();
  if (sizeBytes <= 0) {
    throw new AppError("El archivo está vacío.", "EMPTY_FILE", 400);
  }
  if (sizeBytes > maxSize) {
    throw new AppError(
      `El archivo supera el límite de ${Math.round(maxSize / (1024 * 1024))} MB.`,
      "FILE_TOO_LARGE",
      400,
    );
  }
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function ensureUploadDir(): Promise<string> {
  const uploadDir = path.resolve(getUploadDir());
  await mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

export type StoredFile = {
  storagePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export async function storeFile(
  file: File,
  subdirectory = "general",
): Promise<StoredFile> {
  validateMimeType(file.type);
  validateFileSize(file.size);

  // En Vercel el disco no persiste: sin Blob configurado, el archivo se perdería
  if (process.env.VERCEL && !isBlobStorage()) {
    throw new AppError(
      "El almacenamiento de archivos no está configurado.",
      "STORAGE_NOT_CONFIGURED",
      503,
    );
  }

  const uploadDir = await ensureUploadDir();
  const safeName = sanitizeFilename(file.name || "archivo");
  const uniqueName = `${randomUUID()}-${safeName}`;
  const relativePath = path.join(subdirectory, uniqueName);
  const absolutePath = path.join(uploadDir, relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    storagePath: relativePath,
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

/** Contenido de un archivo guardado, listo para usar como cuerpo de respuesta. */
export async function readStoredFile(
  storagePath: string,
): Promise<Uint8Array<ArrayBuffer> | ReadableStream<Uint8Array>> {
  if (storagePath.startsWith(BLOB_PREFIX)) {
    const result = await get(storagePath.slice(BLOB_PREFIX.length), { access: "private" });
    if (!result || result.statusCode !== 200) {
      throw new AppError("Archivo no encontrado.", "NOT_FOUND", 404);
    }
    return result.stream;
  }

  const absolutePath = path.resolve(getUploadDir(), storagePath);
  const uploadRoot = path.resolve(getUploadDir());

  if (!absolutePath.startsWith(uploadRoot)) {
    throw new AppError("Ruta de archivo inválida.", "INVALID_PATH", 400);
  }

  try {
    return new Uint8Array(await readFile(absolutePath));
  } catch {
    throw new AppError("Archivo no encontrado.", "NOT_FOUND", 404);
  }
}

export async function deleteStoredFile(storagePath: string): Promise<void> {
  if (storagePath.startsWith(BLOB_PREFIX)) {
    try {
      await del(storagePath.slice(BLOB_PREFIX.length));
    } catch (error) {
      // No bloqueamos la eliminación lógica si el blob ya no está.
      console.error("[blob] No se pudo borrar:", error);
    }
    return;
  }

  const absolutePath = path.resolve(getUploadDir(), storagePath);
  const uploadRoot = path.resolve(getUploadDir());

  if (!absolutePath.startsWith(uploadRoot)) {
    throw new AppError("Ruta de archivo inválida.", "INVALID_PATH", 400);
  }

  try {
    await unlink(absolutePath);
  } catch {
    // El archivo puede no existir en disco; no bloqueamos la eliminación lógica.
  }
}

/**
 * Comprueba un archivo que el navegador acaba de subir a Vercel Blob: que
 * esté en la carpeta de la sala y que su tipo y tamaño reales sean válidos.
 * Si no lo son, lo borra.
 */
export async function verifyUploadedBlob(pathname: string, bandId: string): Promise<StoredFile> {
  if (!pathname.startsWith(bandStoragePrefix(bandId)) || pathname.includes("..")) {
    throw new AppError("El archivo no pertenece a esta sala.", "FORBIDDEN", 403);
  }

  let blob;
  try {
    blob = await head(pathname);
  } catch {
    throw new AppError("No encontramos el archivo subido. Vuelve a intentarlo.", "NOT_FOUND", 404);
  }

  try {
    validateMimeType(blob.contentType);
    validateFileSize(blob.size);
  } catch (error) {
    await del(pathname).catch(() => undefined);
    throw error;
  }

  return {
    storagePath: `${BLOB_PREFIX}${pathname}`,
    originalName: path.basename(pathname),
    mimeType: blob.contentType,
    sizeBytes: blob.size,
  };
}

export async function getStoredFileStats(storagePath: string) {
  const absolutePath = path.resolve(getUploadDir(), storagePath);
  return stat(absolutePath);
}