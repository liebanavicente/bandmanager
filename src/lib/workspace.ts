import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Nombre por defecto mientras la banda no se haya configurado. */
export const DEFAULT_BAND_NAME = "Tu banda";

export type BandLinks = Partial<Record<"instagram" | "spotify" | "youtube" | "tiktok" | "web", string>>;

/**
 * Espacio de trabajo único de este despliegue (una banda). Se memoiza por
 * petición para que layout, sidebar y páginas compartan una sola consulta.
 */
export const getBand = cache(async () => {
  return prisma.band.findFirst({ orderBy: { createdAt: "asc" } });
});

/** Datos de la banda que necesita la interfaz (serializables al cliente). */
export type BandSummary = {
  name: string;
  logoData: string | null;
  genre: string | null;
  city: string | null;
  hasStore: boolean;
  onboarded: boolean;
};

export async function getBandSummary(): Promise<BandSummary> {
  const band = await getBand();
  return {
    name: band?.name ?? DEFAULT_BAND_NAME,
    logoData: band?.logoData ?? null,
    genre: band?.genre ?? null,
    city: band?.city ?? null,
    hasStore: band?.hasStore ?? true,
    onboarded: Boolean(band?.onboardedAt),
  };
}
