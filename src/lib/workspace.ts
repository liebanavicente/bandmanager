import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** Nombre por defecto mientras la banda no se haya configurado. */
export const DEFAULT_BAND_NAME = "Tu banda";

export type BandLinks = Partial<Record<"instagram" | "spotify" | "youtube" | "tiktok" | "web", string>>;

/** Sala (banda) por id, memoizada por petición. */
export const getBand = cache(async (bandId: string) => {
  return prisma.band.findUnique({ where: { id: bandId } });
});

/** Datos de la banda que necesita la interfaz (serializables al cliente). */
export type BandSummary = {
  name: string;
  logoData: string | null;
  genre: string | null;
  city: string | null;
  hasStore: boolean;
  onboarded: boolean;
  inviteCode: string;
};

export async function getBandSummary(bandId: string): Promise<BandSummary> {
  const band = await getBand(bandId);
  return {
    name: band?.name ?? DEFAULT_BAND_NAME,
    logoData: band?.logoData ?? null,
    genre: band?.genre ?? null,
    city: band?.city ?? null,
    hasStore: band?.hasStore ?? true,
    onboarded: Boolean(band?.onboardedAt),
    inviteCode: band?.inviteCode ?? "",
  };
}
