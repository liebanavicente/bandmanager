import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Waveform } from "@/components/art/waveform";
import { glassCard } from "@/components/glass/glass";

type StatBlockProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: "red" | "acid" | "none";
  /** Si se indica, toda la tarjeta lleva a esa sección. */
  href?: string;
  className?: string;
};

/**
 * Cifra destacada tipo marcador de mesa de mezclas: etiqueta en mono,
 * número en tipografía de cartel y una onda de fondo como firma.
 */
export function StatBlock({ label, value, icon: Icon, accent = "none", href, className }: StatBlockProps) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        {href ? (
          <ArrowUpRight
            className="size-[18px] shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        ) : (
          Icon && <Icon className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <p
        className={cn(
          "relative z-10 mt-3 flex items-center gap-2 font-display text-5xl leading-none tabular-nums",
          accent === "red" && "text-punk-red",
          accent === "acid" && "text-punk-acid",
        )}
      >
        {value}
        {href && Icon && (
          <Icon
            className={cn(
              "size-5 opacity-60",
              accent === "red" ? "text-punk-red" : accent === "acid" ? "text-punk-acid" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
        )}
      </p>
      <Waveform
        seed={label}
        bars={40}
        className={cn(
          "pointer-events-none absolute -right-2 bottom-2 h-10 w-2/3 opacity-50 transition-opacity group-hover:opacity-100",
          accent === "red" ? "text-punk-red" : accent === "acid" ? "text-punk-acid" : "text-foreground",
        )}
      />
    </>
  );

  const base = cn(
    "stage-edge group relative block overflow-hidden rounded-xl p-4",
    glassCard,
    className,
  );

  if (!href) return <div className={base}>{body}</div>;
  return (
    <Link
      href={href}
      className={cn(
        base,
        "transition-all hover:-translate-y-0.5 hover:shadow-poster focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      )}
    >
      {body}
    </Link>
  );
}
