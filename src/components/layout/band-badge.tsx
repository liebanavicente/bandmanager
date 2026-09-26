import { cn } from "@/lib/utils";
import type { BandSummary } from "@/lib/workspace";

type BandBadgeProps = {
  band: Pick<BandSummary, "name" | "logoData" | "genre" | "city">;
  collapsed?: boolean;
  className?: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Tarjeta de la banda en la barra lateral: logo (o iniciales), directo y nombre. */
export function BandBadge({ band, collapsed = false, className }: BandBadgeProps) {
  const subtitle = [band.genre, band.city].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "stage-surface grain relative flex items-center gap-3 overflow-hidden rounded-xl border border-sidebar-border px-3 py-3",
        collapsed && "justify-center px-1.5 py-2",
        className,
      )}
      title={collapsed ? band.name : undefined}
    >
      <span className="relative shrink-0">
        {band.logoData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={band.logoData}
            alt={`Logo de ${band.name}`}
            className="size-10 rounded-full bg-white/5 object-cover ring-2 ring-white/15"
          />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full bg-stage-gradient font-display text-lg text-stage-ink ring-2 ring-white/15">
            {initials(band.name)}
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 size-2.5 animate-live rounded-full bg-stage-red ring-2 ring-stage-ink"
        />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-white/55">
            En gira
          </span>
          <span className="block truncate font-serif text-xl italic leading-tight text-white">
            {band.name}
          </span>
          {subtitle && (
            <span className="block truncate font-mono text-[9px] uppercase tracking-[0.18em] text-stage-amber/80">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
