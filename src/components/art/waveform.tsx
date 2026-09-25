import { cn } from "@/lib/utils";

type WaveformProps = {
  /** Texto semilla: la misma canción/evento dibuja siempre la misma onda. */
  seed?: string;
  bars?: number;
  /** Fracción (0-1) pintada con el color de acento, como un reproductor. */
  progress?: number;
  className?: string;
};

/** PRNG determinista (mulberry32) a partir de un hash del texto. */
function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function waveformHeights(seed: string, bars: number) {
  const rand = seededRandom(seed);
  return Array.from({ length: bars }, (_, i) => {
    // Envolvente tipo canción: intro, estribillos más fuertes y final
    const t = i / Math.max(1, bars - 1);
    const envelope = 0.45 + 0.35 * Math.sin(t * Math.PI) + 0.2 * Math.sin(t * Math.PI * 4) ** 2;
    return Math.max(0.12, Math.min(1, envelope * (0.55 + rand() * 0.6)));
  });
}

/**
 * Forma de onda decorativa generada a partir de una semilla. SVG puro,
 * se renderiza en servidor y hereda el color con `currentColor`.
 */
export function Waveform({ seed = "bandmanager", bars = 48, progress = 0, className }: WaveformProps) {
  const heights = waveformHeights(seed, bars);
  const gap = 2;
  const barWidth = 3;
  const width = bars * (barWidth + gap) - gap;
  const cut = Math.round(progress * bars);

  return (
    <svg
      viewBox={`0 0 ${width} 40`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-8 w-full", className)}
    >
      {heights.map((h, i) => {
        const barHeight = Math.max(2, h * 40);
        return (
          <rect
            key={i}
            x={i * (barWidth + gap)}
            y={(40 - barHeight) / 2}
            width={barWidth}
            height={barHeight}
            rx={1.5}
            fill={i < cut ? "var(--stage-red)" : "currentColor"}
            opacity={i < cut ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}
