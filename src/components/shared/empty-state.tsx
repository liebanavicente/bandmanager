import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Equalizer } from "@/components/punk/equalizer";
import { Tape } from "@/components/punk/tape";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
};

/** Estado vacío con personalidad fanzine: cartel pegado, nunca un callejón sin salida. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="halftone pointer-events-none absolute inset-0 text-foreground opacity-[0.04]" aria-hidden="true" />
      {/* Sello NFP de fondo para dar vida a las zonas vacías */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/nfp-seal-paper.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-44 rotate-12 opacity-[0.07] select-none"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/nfp-seal-paper.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -left-12 size-52 -rotate-6 opacity-[0.05] select-none"
        draggable={false}
      />
      <Tape className="absolute left-6 top-4 -rotate-6" />
      <div className="relative mb-4 flex size-14 -rotate-3 items-center justify-center rounded-md border bg-card text-primary shadow-poster-sm">
        <Icon className="size-7" />
      </div>
      <h3 className="relative font-display text-lg uppercase tracking-wide">{title}</h3>
      <p className="relative mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Equalizer className="relative mt-4 text-primary" bars={5} />
      {action && (
        <div className="relative mt-6">
          {action.href ? (
            <Button render={<a href={action.href} />} nativeButton={false}>
              {action.label}
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
