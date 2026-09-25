"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CountdownProps = {
  /** Fecha objetivo en ISO (serializable desde Server Components). */
  target: string;
  className?: string;
  /** "stage" para superficies oscuras de escenario. */
  tone?: "default" | "stage";
};

type Remaining = { days: number; hours: number; minutes: number; seconds: number; past: boolean };

function getRemaining(target: number): Remaining {
  const diff = target - Date.now();
  const past = diff <= 0;
  const abs = Math.abs(diff);
  return {
    days: Math.floor(abs / 86_400_000),
    hours: Math.floor((abs / 3_600_000) % 24),
    minutes: Math.floor((abs / 60_000) % 60),
    seconds: Math.floor((abs / 1_000) % 60),
    past,
  };
}

const units: { key: keyof Omit<Remaining, "past">; label: string }[] = [
  { key: "days", label: "días" },
  { key: "hours", label: "horas" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "seg" },
];

/** Cuenta atrás hasta el próximo evento. Numérico tabular, sin saltos de layout. */
export function Countdown({ target, className, tone = "default" }: CountdownProps) {
  const stage = tone === "stage";
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const update = () => setRemaining(getRemaining(targetMs));
    // Primera actualización asíncrona (evita setState síncrono en el efecto)
    const raf = requestAnimationFrame(update);
    const id = setInterval(update, 1_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [targetMs]);

  if (!remaining) {
    // Reserva de espacio estable durante la hidratación
    return <div className={cn("h-[68px]", className)} aria-hidden="true" />;
  }

  if (remaining.past) {
    return (
      <p className={cn("poster-title text-4xl text-stage-gradient", className)}>
        Es hoy. A tocar.
      </p>
    );
  }

  return (
    <div className={cn("flex items-start gap-1.5 sm:gap-2", className)} role="timer" aria-label="Cuenta atrás hasta el próximo evento">
      {units.map(({ key, label }, i) => (
        <div key={key} className="flex items-start gap-1.5 sm:gap-2">
          {i > 0 && (
            <span
              aria-hidden="true"
              className={cn("font-display text-3xl leading-[1.35] sm:text-4xl", stage ? "text-white/30" : "text-muted-foreground/40")}
            >
              :
            </span>
          )}
          <div
            className={cn(
              "relative min-w-[3.25rem] overflow-hidden rounded-md px-2 pb-1.5 pt-2 text-center sm:min-w-16",
              stage ? "bg-black/45 ring-1 ring-white/10 backdrop-blur-sm" : "bg-background/80 ring-1 ring-foreground/10",
            )}
          >
            {/* Línea de "flip" a media altura */}
            <span aria-hidden="true" className={cn("absolute inset-x-0 top-[45%] h-px", stage ? "bg-white/10" : "bg-foreground/10")} />
            <p className={cn("font-display text-3xl leading-none tabular-nums sm:text-4xl", stage && "text-white")}>
              {String(remaining[key]).padStart(2, "0")}
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-[9px] uppercase tracking-[0.2em]",
                stage ? "text-white/55" : "text-muted-foreground",
              )}
            >
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
