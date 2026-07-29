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

/* Semántica en la paleta Backstage: ácido = positivo, tinta invertida = en
 * curso, rojo = alerta/negativo, sello rojo = pendiente, gris = neutro. */
const OK = "bg-punk-acid text-[#0A0A0A]";
const PROGRESS = "bg-foreground text-background";
const BAD = "bg-punk-red text-punk-paper";
const PENDING_STYLE = "border-punk-red/70 bg-transparent text-punk-red";
const NEUTRAL = "bg-muted text-muted-foreground";

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
