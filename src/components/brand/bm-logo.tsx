import { cn } from "@/lib/utils";

type BmLogoProps = {
  /** Tamaño del lado en px (legible de 24 a 48). */
  size?: number;
  className?: string;
  /** Título accesible; vacío si es decorativo. */
  title?: string;
};

/**
 * Logotipo circular "BM": disco oscuro con doble anillo claro, letras
 * claras y la diagonal izquierda de la M en rojo coral. SVG puro, nítido
 * a cualquier tamaño y válido sobre fondos claros y oscuros.
 */
export function BmLogo({ size = 32, className, title = "BandManager" }: BmLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0 select-none", className)}
    >
      {title ? <title>{title}</title> : null}
      {/* Disco oscuro con anillo claro */}
      <circle cx="24" cy="24" r="21.5" fill="#14161A" stroke="#D8DADE" strokeOpacity="0.92" strokeWidth="2.6" />
      <circle cx="24" cy="24" r="17.6" fill="none" stroke="#FFFFFF" strokeOpacity="0.1" strokeWidth="1" />
      {/* Letra B */}
      <text
        x="12.5"
        y="30.6"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="17"
        fontWeight="700"
        fill="#DCDFE3"
      >
        B
      </text>
      {/* Letra M geométrica: diagonal izquierda en coral */}
      <g strokeLinecap="round" strokeWidth="3" fill="none">
        <path d="M23.4 17.6 V 30.6" stroke="#DCDFE3" />
        <path d="M23.9 17.9 L 28.2 26.4" stroke="#EE5044" strokeWidth="3.2" />
        <path d="M28.2 26.4 L 32.5 17.9" stroke="#DCDFE3" />
        <path d="M32.9 17.6 V 30.6" stroke="#DCDFE3" />
      </g>
    </svg>
  );
}
