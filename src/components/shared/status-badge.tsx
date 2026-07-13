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

const statusConfig: Record<
  StatusKind,
  Record<string, { label: string; className: string }>
> = {
  event: {
    DRAFT: { label: "Borrador", className: "bg-muted text-muted-foreground" },
    CONFIRMED: {
      label: "Confirmado",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
    CANCELLED: {
      label: "Cancelado",
      className: "bg-destructive/15 text-destructive",
    },
    COMPLETED: {
      label: "Completado",
      className: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    },
  },
  task: {
    PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    IN_PROGRESS: {
      label: "En curso",
      className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    },
    BLOCKED: { label: "Bloqueada", className: "bg-destructive/15 text-destructive" },
    DONE: { label: "Hecha", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  },
  order: {
    PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    PAID: { label: "Pagado", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    PREPARING: { label: "Preparando", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    SHIPPED: { label: "Enviado", className: "bg-violet-500/15 text-violet-700 dark:text-violet-400" },
    DELIVERED: { label: "Entregado", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    CANCELLED: { label: "Cancelado", className: "bg-destructive/15 text-destructive" },
  },
  payment: {
    PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    PAID: { label: "Pagado", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    REFUNDED: { label: "Reembolsado", className: "bg-muted text-muted-foreground" },
    FAILED: { label: "Fallido", className: "bg-destructive/15 text-destructive" },
  },
  song: {
    PROPOSED: { label: "Propuesta", className: "bg-muted text-muted-foreground" },
    IN_PREPARATION: {
      label: "En preparación",
      className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    },
    REHEARSED: {
      label: "Ensayada",
      className: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    },
    READY: { label: "Lista", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    ARCHIVED: { label: "Archivada", className: "bg-muted text-muted-foreground" },
  },
  attendance: {
    ATTENDING: {
      label: "Asiste",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
    NOT_ATTENDING: {
      label: "No asiste",
      className: "bg-destructive/15 text-destructive",
    },
    PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  },
  product: {
    ACTIVE: { label: "Activo", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    INACTIVE: { label: "Inactivo", className: "bg-muted text-muted-foreground" },
    DISCONTINUED: { label: "Descatalogado", className: "bg-destructive/15 text-destructive" },
  },
  sync: {
    PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    SUCCESS: { label: "Correcto", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    FAILED: { label: "Fallido", className: "bg-destructive/15 text-destructive" },
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
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={cn("border-transparent", config.className, className)}>
      {config.label}
    </Badge>
  );
}