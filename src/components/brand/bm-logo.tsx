import { cn } from "@/lib/utils";

type BmLogoProps = {
  /** Tamaño del lado en px (legible de 16 a 96). */
  size?: number;
  className?: string;
  /** Título accesible; vacío si es decorativo. */
  title?: string;
};

/** Barras de la onda dentro de la púa: [x, alto] en el lienzo de 100. */
export const BM_PICK_BARS: [number, number][] = [
  [21, 7],
  [31, 30],
  [40.5, 46],
  [50, 64],
  [59.5, 44],
  [69, 27],
  [79, 7],
];

/** Silueta de la púa: hombros redondeados y punta suave abajo. */
export const BM_PICK_PATH =
  "M50 97C45 97 41.5 93 37 86C26 69 9 47 6.5 31C4 15 19 4 50 4C81 4 96 15 93.5 31C91 47 74 69 63 86C58.5 93 55 97 50 97Z";

/**
 * Símbolo de BandManager: una púa de guitarra en rojo escenario con una
 * onda de sonido en blanco. Colores fijos: es la marca del producto (no
 * cambia con el color de cada banda) y funciona igual como favicon.
 */
export function BmLogo({ size = 32, className, title = "BandManager" }: BmLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0 select-none", className)}
    >
      {title ? <title>{title}</title> : null}
      <path d={BM_PICK_PATH} fill="#F0301A" />
      {/* Brillo de la línea central de la onda */}
      <rect x="21" y="44" width="58" height="3" rx="1.5" fill="#FFFFFF" opacity="0.35" />
      {BM_PICK_BARS.map(([x, h]) => (
        <rect key={x} x={x - 3} y={45.5 - h / 2} width="6" height={h} rx="3" fill="#FFFFFF" />
      ))}
    </svg>
  );
}
