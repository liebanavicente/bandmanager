import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Music2,
  Package,
  Plus,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { LoadingGrid } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { centsToEuros } from "@/lib/money";

async function DashboardContent() {
  const data = await getDashboardData();

  const statCards = [
    {
      label: "Eventos este mes",
      value: data.stats.eventsThisMonth,
      icon: Calendar,
    },
    {
      label: "Canciones listas",
      value: data.stats.songsReady,
      icon: Music2,
    },
    {
      label: "Mis tareas",
      value: data.stats.pendingTasks,
      icon: ClipboardList,
    },
    {
      label: "Stock bajo",
      value: data.stats.lowStockProducts,
      icon: Package,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(data.nextConcert || data.nextRehearsal) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.nextConcert && (
            <Card>
              <CardHeader>
                <CardTitle>Próximo concierto</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/events/${data.nextConcert.id}`}
                  className="block rounded-lg border p-3 hover:bg-muted/50"
                >
                  <p className="font-medium">{data.nextConcert.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(data.nextConcert.startAt, "EEEE d MMM, HH:mm", { locale: es })}
                    {data.nextConcert.venue ? ` · ${data.nextConcert.venue}` : ""}
                  </p>
                </Link>
              </CardContent>
            </Card>
          )}
          {data.nextRehearsal && (
            <Card>
              <CardHeader>
                <CardTitle>Próximo ensayo</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/events/${data.nextRehearsal.id}`}
                  className="block rounded-lg border p-3 hover:bg-muted/50"
                >
                  <p className="font-medium">{data.nextRehearsal.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(data.nextRehearsal.startAt, "EEEE d MMM, HH:mm", { locale: es })}
                    {data.nextRehearsal.venue ? ` · ${data.nextRehearsal.venue}` : ""}
                  </p>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos eventos</CardTitle>
            <CardDescription>Agenda confirmada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos próximos.</p>
            ) : (
              data.upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.startAt, "d MMM yyyy, HH:mm", { locale: es })}
                      {event.venue ? ` · ${event.venue}` : ""}
                    </p>
                  </div>
                  <StatusBadge kind="event" status={event.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis tareas</CardTitle>
            <CardDescription>Pendientes y en curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin tareas pendientes.</p>
            ) : (
              data.pendingTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    {task.dueAt && (
                      <p className="text-xs text-muted-foreground">
                        Vence {format(task.dueAt, "d MMM", { locale: es })}
                      </p>
                    )}
                  </div>
                  <StatusBadge kind="task" status={task.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {data.stockAlerts.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                Stock bajo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {data.stockAlerts.map((alert) => (
                <div key={alert.name} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{alert.name}</p>
                  <p className="text-muted-foreground">
                    {alert.stock} uds (mín. {alert.minStock})
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pedidos recientes</CardTitle>
            <CardDescription>
              Ingresos recientes: {data.stats.recentRevenueFormatted}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay pedidos.</p>
            ) : (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/orders"
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(order.createdAt, "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {centsToEuros(order.totalCents)}
                    </span>
                    <StatusBadge kind="order" status={order.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel"
        description={`Hola — resumen de la actividad de la banda.`}
      >
        <Button render={<Link href="/events/new" />}>
          <Plus />
          Nuevo evento
        </Button>
      </PageHeader>

      <Suspense fallback={<LoadingGrid />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}