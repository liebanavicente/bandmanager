import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Waveform } from "@/components/art/waveform";

type StatBlockProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: "red" | "acid" | "none";
  className?: string;
};

/**
 * Cifra destacada tipo marcador de mesa de mezclas: etiqueta en mono,
 * número en tipografía de cartel y una onda de fondo como firma.
 */
export function StatBlock({ label, value, icon: Icon, accent = "none", className }: StatBlockProps) {
  return (
    <div
      className={cn(
        "stage-edge group relative overflow-hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-poster",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        {Icon && (
          <Icon
            className={cn(
              "size-[18px] shrink-0",
              accent === "red" && "text-punk-red",
              accent === "acid" && "text-punk-acid",
              accent === "none" && "text-muted-foreground",
            )}
            aria-hidden="true"
          />
        )}
      </div>
      <p
        className={cn(
          "relative z-10 mt-3 font-display text-5xl leading-none tabular-nums",
          accent === "red" && "text-punk-red",
          accent === "acid" && "text-punk-acid",
        )}
      >
        {value}
      </p>
      <Waveform
        seed={label}
        bars={40}
        className={cn(
          "pointer-events-none absolute -right-2 bottom-2 h-10 w-2/3 opacity-60 transition-opacity group-hover:opacity-100",
          accent === "red" ? "text-punk-red" : accent === "acid" ? "text-punk-acid" : "text-foreground",
        )}
      />
    </div>
  );
}
