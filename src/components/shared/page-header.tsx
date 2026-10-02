import { navItems, navSections } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Etiqueta superior; por defecto, la cara y la pista de la sección si coincide con el menú. */
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
};

function defaultEyebrow(title: string) {
  const index = navItems.findIndex((item) => item.label === title);
  if (index === -1) return undefined;
  const item = navItems[index];
  const side = String.fromCharCode(65 + navSections.indexOf(item.section));
  return `Cara ${side} · Pista ${String(index + 1).padStart(2, "0")}`;
}

/**
 * Cabecera de página editorial (la de Apuntes): etiqueta en el acento,
 * titular de cartel con su almohadilla, descripción en la voz serif de la
 * banda y un filete de tinta que cierra la cabecera.
 */
export function PageHeader({ title, description, eyebrow, children, className }: PageHeaderProps) {
  const kicker = eyebrow ?? defaultEyebrow(title);

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          {kicker && <p className="eyebrow">{kicker}</p>}
          <h1 className="poster-title break-words text-5xl sm:text-6xl lg:text-7xl">
            <span aria-hidden="true" className="text-stage-gradient">
              #
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
      <div className="rule" />
    </div>
  );
}
