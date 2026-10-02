/**
 * Color de acento de cada banda. Se guarda un único hex (#RRGGBB) y de él
 * se derivan las variantes que necesita la interfaz para que cualquier
 * color se lea bien: texto sobre el acento (negro o blanco), una versión
 * oscurecida para usarla como texto sobre el papel claro y otra aclarada
 * para las superficies negras de "escenario".
 */

/** Acento de BandManager (pantallas públicas y bandas sin color propio). */
export const DEFAULT_BAND_COLOR = "#E0301E";

/** Papel y tinta del sistema editorial: deben coincidir con globals.css. */
const PAPER = "#F7F7F3";
const INK = "#090909";

/** Paleta curada que se ofrece junto al selector libre. */
export const BAND_COLOR_PRESETS = [
  { name: "Rojo escenario", value: "#E0301E" },
  { name: "Lima", value: "#D7FF00" },
  { name: "Naranja", value: "#FF6B00" },
  { name: "Ámbar", value: "#FFB000" },
  { name: "Verde", value: "#1FAF5A" },
  { name: "Turquesa", value: "#00B3A4" },
  { name: "Cobalto", value: "#2F5BFF" },
  { name: "Violeta", value: "#7A3CFF" },
  { name: "Rosa", value: "#FF3D8B" },
  { name: "Negro", value: "#111111" },
] as const;

type Rgb = [number, number, number];

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normaliza a "#RRGGBB" en mayúsculas; null si no es un hex válido. */
export function normalizeHex(value: string | null | undefined): string | null {
  const match = value?.trim().match(HEX_PATTERN);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  return `#${hex.toUpperCase()}`;
}

function toRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/** Luminancia relativa (WCAG 2.x). */
export function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(hex: string, target: string, amount: number): string {
  const a = toRgb(hex);
  const b = toRgb(target);
  return toHex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as Rgb);
}

/** Mezcla el color hacia `target` en pasos hasta alcanzar el contraste pedido con `against`. */
function untilContrast(hex: string, target: string, against: string, ratio: number): string {
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(hex, target, step / 20);
    if (contrast(candidate, against) >= ratio) return candidate;
  }
  return target;
}

export type BandPalette = {
  /** El acento tal cual: fondos, bloques activos, botones primarios. */
  base: string;
  /** Texto sobre el acento: tinta o blanco, el que más contraste dé. */
  ink: string;
  /** Acento como texto pequeño sobre el papel (contraste AA 4.5:1). */
  text: string;
  /** Acento para titulares grandes sobre el papel (contraste 3:1). */
  display: string;
  /** Acento sobre las superficies negras de escenario (contraste AA 4.5:1). */
  bright: string;
};

export function bandPalette(color: string | null | undefined): BandPalette {
  const base = normalizeHex(color) ?? DEFAULT_BAND_COLOR;
  return {
    base,
    ink: contrast(base, INK) >= contrast(base, "#FFFFFF") ? INK : "#FFFFFF",
    text: untilContrast(base, INK, PAPER, 4.5),
    display: untilContrast(base, INK, PAPER, 3),
    bright: untilContrast(base, "#FFFFFF", INK, 4.5),
  };
}

/** Variables CSS del acento, para el `style` del contenedor de la sala. */
export function bandColorVars(color: string | null | undefined): Record<string, string> {
  const p = bandPalette(color);
  return {
    "--band": p.base,
    "--band-ink": p.ink,
    "--band-text": p.text,
    "--band-display": p.display,
    "--band-bright": p.bright,
  };
}

/**
 * Color dominante de una imagen a partir de sus píxeles RGBA (p. ej. de un
 * canvas reducido). Ignora transparentes y casi blancos/negros/grises, que
 * suelen ser el fondo o el trazo del logo, y prefiere los colores vivos.
 * Devuelve null si el logo es monocromo.
 */
export function dominantColor(pixels: ArrayLike<number>): string | null {
  const buckets = new Map<number, { weight: number; r: number; g: number; b: number }>();

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    if (a < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < 0.25 || max < 40) continue;

    // Cubos de 4 bits por canal; los colores vivos pesan más
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const weight = 1 + saturation * 2;
    const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0 };
    bucket.weight += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    buckets.set(key, bucket);
  }

  let best: { weight: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.weight > best.weight) best = bucket;
  }
  if (!best) return null;
  return toHex([best.r / best.weight, best.g / best.weight, best.b / best.weight]);
}
