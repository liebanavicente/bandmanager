import { mkdir, writeFile, readFile, unlink, stat } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { AppError } from "@/lib/errors";

const DEFAULT_UPLOAD_DIR = "./uploads";
const DEFAULT_MAX_SIZE_MB = 10;

const ALLOWED_MIME_TYPES = new Set([
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

function sanitizeFilename(filename: string): string {
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

export async function readStoredFile(storagePath: string): Promise<Buffer> {
  const absolutePath = path.resolve(getUploadDir(), storagePath);
  const uploadRoot = path.resolve(getUploadDir());

  if (!absolutePath.startsWith(uploadRoot)) {
    throw new AppError("Ruta de archivo inválida.", "INVALID_PATH", 400);
  }

  try {
    return await readFile(absolutePath);
  } catch {
    throw new AppError("Archivo no encontrado.", "NOT_FOUND", 404);
  }
}

export async function deleteStoredFile(storagePath: string): Promise<void> {
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

export async function getStoredFileStats(storagePath: string) {
  const absolutePath = path.resolve(getUploadDir(), storagePath);
  return stat(absolutePath);
}