import { z } from "zod";
import { EventType, UserRole } from "@prisma/client";

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

/**
 * Enlace opcional. La gente escribe "instagram.com/tubanda" sin protocolo:
 * se completa con https:// y solo se aceptan http(s) con dominio real.
 */
const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
    })
    .pipe(
      z
        .url({
          protocol: /^https?$/,
          hostname: z.regexes.domain,
          message: `${label}: el enlace no es válido (ej. https://instagram.com/tubanda).`,
        })
        .optional(),
    );

/** Logo como data URL de imagen, ya reducido en el navegador. */
export const logoDataSchema = z
  .string()
  .max(700_000, "El logo es demasiado pesado (máx. ~500 KB).")
  .regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/, "Formato de logo no válido.")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Dinos tu nombre.").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(200),
  /** Con código te unes a esa sala; sin código creas una sala nueva. */
  inviteCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  instrument: optionalText(120),
});

export const bandLinksSchema = z.object({
  instagram: optionalUrl("Instagram"),
  spotify: optionalUrl("Spotify"),
  youtube: optionalUrl("YouTube"),
  tiktok: optionalUrl("TikTok"),
  web: optionalUrl("Web"),
});

export const onboardingMemberSchema = z.object({
  name: z.string().trim().min(1, "Cada componente necesita un nombre.").max(120),
  instrument: optionalText(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email de componente inválido.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  role: z.enum([UserRole.MEMBER, UserRole.COLLABORATOR]).default(UserRole.MEMBER),
});

export const onboardingSchema = z.object({
  // Banda
  name: z.string().trim().min(1, "La banda necesita un nombre.").max(120),
  logoData: logoDataSchema,
  genre: optionalText(80),
  city: optionalText(80),
  foundedYear: z.coerce.number().int().min(1900).max(2100).optional(),
  bio: optionalText(1000),
  // Tú
  myInstrument: optionalText(120),
  // Componentes
  members: z.array(onboardingMemberSchema).max(30).default([]),
  // Música
  songTitles: z.array(z.string().trim().min(1).max(200)).max(100).default([]),
  // Tienda
  hasStore: z.boolean().default(false),
  storeUrl: optionalUrl("Tienda online"),
  firstProduct: z
    .object({
      name: z.string().trim().min(1).max(200),
      priceEuros: z.coerce.number().min(0).max(100_000),
      category: z.string().trim().min(1).max(80).default("Merch"),
    })
    .optional(),
  // Redes
  links: bandLinksSchema.prefault({}),
  // Primer evento
  firstEvent: z
    .object({
      title: z.string().trim().min(1).max(200),
      type: z.nativeEnum(EventType).default(EventType.CONCERT),
      startAt: z.coerce.date({ message: "Fecha inválida." }),
      venue: optionalText(200),
    })
    .optional(),
});

export const updateBandSchema = z.object({
  name: z.string().trim().min(1, "La banda necesita un nombre.").max(120),
  logoData: z.null().or(logoDataSchema),
  genre: optionalText(80),
  city: optionalText(80),
  foundedYear: z.coerce.number().int().min(1900).max(2100).optional(),
  bio: optionalText(1000),
  hasStore: z.boolean(),
  storeUrl: optionalUrl("Tienda online"),
  links: bandLinksSchema.prefault({}),
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingMemberInput = z.input<typeof onboardingMemberSchema>;
