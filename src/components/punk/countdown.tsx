"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type CountdownProps = {
  /** Fecha objetivo en ISO (serializable desde Server Components). */
  target: string;
  className?: string;
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
export function Countdown({ target, className }: CountdownProps) {
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
    return <div className={cn("h-[72px]", className)} aria-hidden="true" />;
  }

  if (remaining.past) {
    return (
      <p className={cn("text-lg font-semibold text-punk-red", className)}>
        Es hoy. A tocar.
      </p>
    );
  }

  return (
    <div className={cn("flex gap-3", className)} role="timer" aria-label="Cuenta atrás hasta el próximo evento">
      {units.map(({ key, label }) => (
        <div key={key} className="min-w-14 rounded-lg bg-background/80 px-2 py-1.5 text-center ring-1 ring-foreground/10">
          <p className="text-2xl font-semibold leading-none tabular-nums">
            {String(remaining[key]).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
