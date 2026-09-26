import type { FileCategory } from "@prisma/client";

export const fileCategoryLabels: Record<FileCategory, string> = {
  CONTRACT: "Contrato",
  TECH_RIDER: "Rider técnico",
  HOSPITALITY_RIDER: "Rider hospitality",
  POSTER: "Cartel",
  PHOTO: "Foto",
  INVOICE: "Factura",
  LYRICS: "Letra",
  SHEET_MUSIC: "Partitura",
  AUDIO: "Audio",
  INTERNAL: "Interno",
  OTHER: "Otro",
};
