import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, ShoppingCart } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { listOrders } from "@/actions/orders";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { OrderActions } from "@/components/orders/order-actions";
import { auth } from "@/lib/auth";
import { canManage } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { centsToEuros } from "@/lib/money";
import { ListPanel, ListRow } from "@/components/shared/list-panel";

const orderStatusOptions = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Pagado" },
  { value: "PREPARING", label: "Preparando" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

const channelLabels = {
  WEB: "Web",
  CONCERT: "Concierto",
  DIRECT: "Directo",
  OTHER: "Otro",
} as const;

async function OrdersList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: OrderStatus }>;
}) {
  const [params, session] = await Promise.all([searchParams, auth()]);
  const result = await listOrders({ search: params.q, status: params.status });
  const manage = session?.user ? canManage(session.user.role, "orders") : false;

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const orders = result.data.items;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Sin pedidos"
        description="Registra ventas en concierto o sincroniza con la tienda."
        action={{ label: "Venta rápida", href: "/orders/quick-sale" }}
      />
    );
  }

  return (
    <ListPanel>
      {orders.map((order) => (
        <ListRow
          key={order.id}
          title={order.orderNumber}
          badges={<StatusBadge kind="order" status={order.status} />}
          meta={
            <>
              <p>
                {order.customerName} · {channelLabels[order.channel]} ·{" "}
                {format(order.createdAt, "d MMM yyyy, HH:mm", { locale: es })}
              </p>
              <p className="text-xs">
                {order.items.length} artículos
                {order.createdBy?.profile?.name && ` · ${order.createdBy.profile.name}`}
              </p>
            </>
          }
          trailing={
            <span className="font-display text-3xl leading-none text-foreground tabular-nums">
              {centsToEuros(order.totalCents)}
            </span>
          }
          actions={<OrderActions order={order} canManage={manage} />}
        />
      ))}
    </ListPanel>
  );
}

export default function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: OrderStatus }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Ventas online, en concierto y directas."
      >
        <Button nativeButton={false} render={<Link href="/orders/quick-sale" />}>
          <Plus />
          Venta rápida
        </Button>
      </PageHeader>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <SearchFilters
          searchPlaceholder="Buscar por nº pedido o cliente…"
          statusOptions={orderStatusOptions}
        />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}