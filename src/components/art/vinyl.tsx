import { useId } from "react";
import { cn } from "@/lib/utils";

type VinylProps = {
  className?: string;
  /** Gira como sobre el plato (se detiene con prefers-reduced-motion). */
  spin?: boolean;
  /** Texto corto en la galleta central. */
  label?: string;
};

/**
 * Disco de vinilo en SVG: surcos, reflejo de luz y galleta central con el
 * gradiente de foco. Puramente decorativo.
 */
export function Vinyl({ className, spin = false, label }: VinylProps) {
  const uid = useId().replace(/:/g, "");
  const grooves = Array.from({ length: 16 }, (_, i) => 30 + i * 3.6);

  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={cn("select-none", spin && "animate-spin-slow", className)}
    >
      <defs>
        <radialGradient id={`vinyl-body-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1B1720" />
          <stop offset="100%" stopColor="#060508" />
        </radialGradient>
        <linearGradient id={`vinyl-label-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--stage-red)" />
          <stop offset="100%" stopColor="var(--stage-amber)" />
        </linearGradient>
        <linearGradient id={`vinyl-shine-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="99" fill={`url(#vinyl-body-${uid})`} />
      {grooves.map((r) => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#FFFFFF" strokeOpacity={0.05} strokeWidth="0.8" />
      ))}
      <circle cx="100" cy="100" r="97" fill="none" stroke="#FFFFFF" strokeOpacity="0.12" strokeWidth="1" />
      {/* Reflejo de foco sobre los surcos */}
      <path d="M100 100 L 30 12 A 99 99 0 0 1 100 1 Z" fill={`url(#vinyl-shine-${uid})`} />
      <path d="M100 100 L 170 188 A 99 99 0 0 1 100 199 Z" fill={`url(#vinyl-shine-${uid})`} />
      <circle cx="100" cy="100" r="28" fill={`url(#vinyl-label-${uid})`} />
      <circle cx="100" cy="100" r="28" fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="1" />
      {label ? (
        <>
          {/* Nombre curvado sobre la galleta, como en un sello discográfico */}
          <path id={`vinyl-arc-${uid}`} d="M 80 100 A 20 20 0 0 1 120 100" fill="none" />
          <text
            fontFamily="var(--font-anton), Impact, sans-serif"
            fontSize="8"
            letterSpacing="0.8"
            fill="#16131A"
          >
            <textPath href={`#vinyl-arc-${uid}`} startOffset="50%" textAnchor="middle">
              {label.toUpperCase().slice(0, 16)}
            </textPath>
          </text>
        </>
      ) : null}
      <text
        x="100"
        y="117"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono), monospace"
        fontSize="5"
        letterSpacing="1.5"
        fill="#16131A"
        opacity="0.7"
      >
        33⅓ RPM
      </text>
      <circle cx="100" cy="100" r="3.2" fill="#08070B" />
    </svg>
  );
}
