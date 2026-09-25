import { cn } from "@/lib/utils";

type BmLogoProps = {
  /** Tamaño del lado en px (legible de 24 a 48). */
  size?: number;
  className?: string;
  /** Título accesible; vacío si es decorativo. */
  title?: string;
};

/**
 * Logotipo "BM" como disco de vinilo: disco de tinta con surcos, galleta
 * central en gradiente de foco (rojo → ámbar) y las iniciales en
 * tipografía de cartel. Colores fijos para que funcione igual como
 * favicon y sobre fondos claros u oscuros.
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
      <defs>
        <linearGradient id="bm-label" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF4A33" />
          <stop offset="100%" stopColor="#FFB547" />
        </linearGradient>
      </defs>
      {/* Disco y surcos */}
      <circle cx="24" cy="24" r="23" fill="#0B090E" />
      <circle cx="24" cy="24" r="22.2" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="0.8" />
      <circle cx="24" cy="24" r="19.8" fill="none" stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth="0.7" />
      <circle cx="24" cy="24" r="17.8" fill="none" stroke="#FFFFFF" strokeOpacity="0.09" strokeWidth="0.7" />
      {/* Reflejo */}
      <path d="M8.5 9.5 A 22 22 0 0 1 20 2.3" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
      {/* Galleta con iniciales */}
      <circle cx="24" cy="24" r="15" fill="url(#bm-label)" />
      <text
        x="24"
        y="29.6"
        textAnchor="middle"
        fontFamily="var(--font-anton), Impact, 'Arial Narrow', sans-serif"
        fontSize="15.5"
        letterSpacing="0.3"
        fill="#0B090E"
      >
        BM
      </text>
    </svg>
  );
}
