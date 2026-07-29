import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatBlockProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: "red" | "acid" | "none";
  className?: string;
};

/** Cifra destacada con tipografía display. Legible primero, expresiva después. */
export function StatBlock({ label, value, icon: Icon, accent = "none", className }: StatBlockProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 bg-card p-4 shadow-poster-sm card-lift",
        className,
      )}
    >
      {/* Textura de semitonos y barra de acento al borde */}
      <div className="halftone pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden="true" />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          accent === "red" && "bg-punk-red",
          accent === "acid" && "bg-punk-acid",
          accent === "none" && "bg-border",
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p
            className={cn(
              "font-display text-4xl leading-none tracking-tight tabular-nums",
              accent === "red" && "text-punk-red",
              accent === "acid" && "text-punk-acid",
            )}
          >
            {value}
          </p>
          <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
        </div>
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 -rotate-3 items-center justify-center rounded-md border shadow-poster-sm",
              accent === "acid"
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}
