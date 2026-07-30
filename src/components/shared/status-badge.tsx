import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusKind =
  | "event"
  | "task"
  | "order"
  | "payment"
  | "song"
  | "attendance"
  | "product"
  | "sync";

/* Semántica sobria: verde suave = positivo, neutro = en curso, coral =
 * alerta/negativo o pendiente de acción, gris = sin estado. */
const OK = "bg-punk-acid/15 text-punk-acid ring-1 ring-punk-acid/30";
const PROGRESS = "bg-secondary text-secondary-foreground ring-1 ring-foreground/10";
const BAD = "bg-punk-red/15 text-punk-red ring-1 ring-punk-red/30";
const PENDING_STYLE = "bg-punk-red/10 text-punk-red ring-1 ring-punk-red/25";
const NEUTRAL = "bg-muted text-muted-foreground ring-1 ring-foreground/10";

const statusConfig: Record<
  StatusKind,
  Record<string, { label: string; className: string }>
> = {
  event: {
    DRAFT: { label: "Borrador", className: NEUTRAL },
    CONFIRMED: { label: "Confirmado", className: OK },
    CANCELLED: { label: "Cancelado", className: BAD },
    COMPLETED: { label: "Completado", className: PROGRESS },
  },
  task: {
    PENDING: { label: "Pendiente", className: PENDING_STYLE },
    IN_PROGRESS: { label: "En curso", className: PROGRESS },
    BLOCKED: { label: "Bloqueada", className: BAD },
    DONE: { label: "Hecha", className: OK },
  },
  order: {
    PENDING: { label: "Pendiente", className: PENDING_STYLE },
    PAID: { label: "Pagado", className: OK },
    PREPARING: { label: "Preparando", className: PROGRESS },
    SHIPPED: { label: "Enviado", className: PROGRESS },
    DELIVERED: { label: "Entregado", className: OK },
    CANCELLED: { label: "Cancelado", className: BAD },
  },
  payment: {
    PENDING: { label: "Pendiente", className: PENDING_STYLE },
    PAID: { label: "Pagado", className: OK },
    REFUNDED: { label: "Reembolsado", className: NEUTRAL },
    FAILED: { label: "Fallido", className: BAD },
  },
  song: {
    PROPOSED: { label: "Propuesta", className: NEUTRAL },
    IN_PREPARATION: { label: "En preparación", className: PROGRESS },
    REHEARSED: { label: "Ensayada", className: PROGRESS },
    READY: { label: "Lista", className: OK },
    ARCHIVED: { label: "Archivada", className: NEUTRAL },
  },
  attendance: {
    ATTENDING: { label: "Asiste", className: OK },
    NOT_ATTENDING: { label: "No asiste", className: BAD },
    PENDING: { label: "Pendiente", className: PENDING_STYLE },
  },
  product: {
    ACTIVE: { label: "Activo", className: OK },
    INACTIVE: { label: "Inactivo", className: NEUTRAL },
    DISCONTINUED: { label: "Descatalogado", className: BAD },
  },
  sync: {
    PENDING: { label: "Pendiente", className: PENDING_STYLE },
    SUCCESS: { label: "Correcto", className: OK },
    FAILED: { label: "Fallido", className: BAD },
  },
};

type StatusBadgeProps = {
  kind: StatusKind;
  status: string;
  className?: string;
};

export function StatusBadge({ kind, status, className }: StatusBadgeProps) {
  const config = statusConfig[kind][status] ?? {
    label: status,
    className: NEUTRAL,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm border-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
