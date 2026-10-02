import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassCard } from "@/components/glass/glass";

/**
 * Lista editorial (la de Apuntes): un solo bloque de cristal con las filas
 * separadas por filetes, en lugar de una tarjeta por elemento.
 */
export function ListPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("divide-y divide-hairline overflow-hidden rounded-xl", glassCard, className)}>{children}</ul>;
}

type ListRowProps = {
  /** Toda la fila abre esta ficha (enlace extendido) y se invierte a tinta al pasar. */
  href?: string;
  title: React.ReactNode;
  /** Junto al título: estado, categoría… */
  badges?: React.ReactNode;
  /** Línea secundaria bajo el título. */
  meta?: React.ReactNode;
  /** Bloque a la izquierda; por defecto, el círculo con flecha si la fila enlaza. */
  leading?: React.ReactNode;
  /** Datos a la derecha (cifras, prioridad, etiquetas). */
  trailing?: React.ReactNode;
  /** Menú o botones; quedan por encima del enlace extendido. */
  actions?: React.ReactNode;
  className?: string;
};

export function ListRow({ href, title, badges, meta, leading, trailing, actions, className }: ListRowProps) {
  const marker =
    leading ??
    (href ? (
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-band text-band-ink ring-1 ring-ink/10 transition-transform duration-200 group-hover:rotate-45"
      >
        <ArrowUpRight className="size-4" />
      </span>
    ) : null);

  return (
    <li
      className={cn(
        "group relative flex items-center gap-4 px-4 py-3.5 transition-colors duration-200 sm:px-5",
        href ? "list-row-link hover:bg-ink hover:text-white" : "hover:bg-white/60",
        className,
      )}
    >
      {marker}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {href ? (
              <Link
                href={href}
                className="font-bold transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-band-bright focus-visible:outline-none"
              >
                {title}
              </Link>
            ) : (
              <h3 className="font-bold">{title}</h3>
            )}
            {badges}
          </div>
          {meta && <div className="text-sm text-muted-foreground">{meta}</div>}
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">{trailing}</div>}
      </div>
      {actions && <div className="relative z-10 flex shrink-0 items-center gap-1">{actions}</div>}
    </li>
  );
}
