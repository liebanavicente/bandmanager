import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/** Estado vacío: disco parado, titular de cartel, mensaje y una acción. */
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
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center",
        className,
      )}
    >
      {/* Vinilo parado con el icono en la galleta */}
      <div className="vinyl-grooves relative mb-5 flex size-20 items-center justify-center rounded-full bg-stage-ink shadow-poster ring-1 ring-foreground/10">
        <div className="flex size-9 items-center justify-center rounded-full bg-stage-gradient text-stage-ink">
          <Icon className="size-[18px]" aria-hidden="true" />
        </div>
      </div>
      <h3 className="poster-title text-3xl">{title}</h3>
      <p className="mt-2 max-w-sm font-serif text-lg italic leading-snug text-muted-foreground">{description}</p>
      {/* Silencio: línea plana */}
      <span aria-hidden="true" className="mt-5 h-px w-24 bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      {action && (
        <div className="mt-6">
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
