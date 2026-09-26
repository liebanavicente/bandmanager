import { randomBytes } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

// Sin 0/O, 1/I/L: se dicta por teléfono o en el local de ensayo sin dudas
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function block(length: number) {
  return Array.from(randomBytes(length), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/**
 * Código con forma "VOLT-7K2Q": las 4 primeras letras del nombre (legibles
 * porque forman palabra) + 4 caracteres aleatorios sin ambigüedades.
 */
export function buildInviteCode(bandName?: string) {
  const letters = (bandName ?? "")
    .normalize("NFD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 4);
  const prefix = letters.length >= 3 ? letters.padEnd(4, block(1)) : block(4);
  return `${prefix}-${block(4)}`;
}

/** Normaliza lo que teclea la gente: mayúsculas, sin espacios, guion opcional. */
export function normalizeInviteCode(input: string) {
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.length === 8 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact;
}

export async function generateUniqueInviteCode(
  db: PrismaClient | Prisma.TransactionClient,
  bandName?: string,
) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = buildInviteCode(attempt < 4 ? bandName : undefined);
    const clash = await db.band.findUnique({ where: { inviteCode: code } });
    if (!clash) return code;
  }
  throw new Error("No se pudo generar un código de invitación único.");
}
