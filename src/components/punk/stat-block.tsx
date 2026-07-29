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
        "relative overflow-hidden rounded-lg border bg-card p-4 card-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
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
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}
