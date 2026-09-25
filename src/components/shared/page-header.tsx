import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Waveform } from "@/components/art/waveform";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Antetítulo en mono; por defecto, la "pista" de la sección si coincide con el menú. */
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
};

function defaultEyebrow(title: string) {
  const index = navItems.findIndex((item) => item.label === title);
  if (index === -1) return undefined;
  return `Pista ${String(index + 1).padStart(2, "0")} · ${navItems[index].section}`;
}

/**
 * Cabecera de página como cartel: antetítulo en mono, titular condensado
 * en caja alta con un eco en trazo rojo y una forma de onda propia de
 * cada página a modo de firma visual.
 */
export function PageHeader({ title, description, eyebrow, children, className }: PageHeaderProps) {
  const kicker = eyebrow ?? defaultEyebrow(title);

  return (
    <div className={cn("relative border-b pb-6", className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          {kicker && (
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
              <span aria-hidden="true" className="h-px w-6 bg-stage-gradient" />
              {kicker}
            </p>
          )}
          <h1 className="poster-title relative isolate break-words text-4xl sm:text-5xl lg:text-6xl">
            <span
              aria-hidden="true"
              className="text-outline pointer-events-none absolute left-[3px] top-[3px] -z-10 select-none opacity-50 [--stroke:var(--stage-red)]"
            >
              {title}
            </span>
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl font-serif text-lg italic leading-snug text-muted-foreground sm:text-xl">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
      </div>
      <Waveform
        seed={title}
        bars={96}
        className="pointer-events-none absolute -bottom-px right-0 hidden h-6 w-1/2 max-w-md translate-y-1/2 text-foreground/60 md:block"
      />
    </div>
  );
}
