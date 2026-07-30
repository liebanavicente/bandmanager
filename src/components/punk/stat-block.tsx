import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatBlockProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: "red" | "acid" | "none";
  className?: string;
};

/** Cifra destacada sobria: etiqueta, valor y un icono pequeño funcional. */
export function StatBlock({ label, value, icon: Icon, accent = "none", className }: StatBlockProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-poster",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
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
          "mt-2 text-3xl font-semibold leading-none tracking-tight tabular-nums",
          accent === "red" && "text-punk-red",
        )}
      >
        {value}
      </p>
    </div>
  );
}
