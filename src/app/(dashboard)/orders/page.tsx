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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { centsToEuros } from "@/lib/money";

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
  const params = await searchParams;
  const result = await listOrders({ search: params.q, status: params.status });

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
    <div className="grid gap-3">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{order.orderNumber}</h3>
                <StatusBadge kind="order" status={order.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {order.customerName} · {channelLabels[order.channel]} ·{" "}
                {format(order.createdAt, "d MMM yyyy, HH:mm", { locale: es })}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.items.length} artículos
                {order.createdBy?.profile?.name &&
                  ` · ${order.createdBy.profile.name}`}
              </p>
            </div>
            <span className="text-lg font-semibold">
              {centsToEuros(order.totalCents)}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
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
        <Button render={<Link href="/orders/quick-sale" />}>
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