import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  Calendar,
  CalendarPlus,
  ClipboardList,
  FileAudio,
  Music2,
  Package,
  ShoppingCart,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { LoadingGrid } from "@/components/shared/loading-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Countdown } from "@/components/punk/countdown";
import { StatBlock } from "@/components/punk/stat-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { centsToEuros } from "@/lib/money";

async function DashboardContent() {
  const data = await getDashboardData();
  const nextEvent = data.nextConcert ?? data.nextRehearsal ?? data.upcomingEvents[0] ?? null;
  const repertoireSongs = data.activeRepertoire?.songs.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Panel</h1>
          <p className="text-sm text-muted-foreground">
            Resumen general · Hola, {data.user.name}
          </p>
        </div>
        <Button render={<Link href="/events/new" />}>
          <CalendarPlus />
          Crear evento
        </Button>
      </div>

      {/* Próximo evento + cuenta atrás */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximo evento</CardTitle>
          {nextEvent && (
            <CardDescription>
              {format(nextEvent.startAt, "EEEE d MMM, HH:mm", { locale: es })}
              {nextEvent.venue ? ` · ${nextEvent.venue}` : ""}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {nextEvent ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <Link
                href={`/events/${nextEvent.id}`}
                className="text-lg font-medium underline-offset-4 hover:underline"
              >
                {nextEvent.title}
              </Link>
              <Countdown target={nextEvent.startAt.toISOString()} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay nada en el calendario. Crea el próximo concierto o ensayo
              y empieza la cuenta atrás.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cifras destacadas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="Eventos este mes" value={data.stats.eventsThisMonth} icon={Calendar} />
        <StatBlock label="Canciones listas" value={data.stats.songsReady} icon={Music2} accent="acid" />
        <StatBlock label="Mis tareas" value={data.stats.pendingTasks} icon={ClipboardList} />
        <StatBlock
          label="Stock bajo"
          value={data.stats.lowStockProducts}
          icon={Package}
          accent={data.stats.lowStockProducts > 0 ? "red" : "none"}
        />
      </div>

      {/* Rejilla principal */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Próximos eventos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Próximos eventos</CardTitle>
            <CardDescription>Agenda confirmada y borradores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.upcomingEvents.length === 0 ? (
              <EmptyLine text="No hay eventos próximos. ¿Montamos algo?" href="/events/new" action="Crear evento" />
            ) : (
              data.upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/60"
                >
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
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

        {/* Asistencias pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu asistencia</CardTitle>
            <CardDescription>Confirmaciones pendientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pendingAttendances.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todo confirmado. Buen trabajo.
              </p>
            ) : (
              data.pendingAttendances.map((attendance) => (
                <Link
                  key={attendance.id}
                  href={`/events/${attendance.eventId}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 ring-1 ring-punk-red/25 transition-colors hover:bg-punk-red/5"
                >
                  <div>
                    <p className="text-sm font-medium">{attendance.event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(attendance.event.startAt, "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <StatusBadge kind="attendance" status="PENDING" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tareas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mis tareas</CardTitle>
            <CardDescription>Pendientes y en curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pendingTasks.length === 0 ? (
              <EmptyLine text="Sin tareas pendientes." href="/tasks" action="Ver tareas" />
            ) : (
              data.pendingTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/60"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
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

        {/* Estado del repertorio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repertorio</CardTitle>
            <CardDescription>
              {data.activeRepertoire
                ? `${data.activeRepertoire.name} · activo`
                : "Sin repertorio activo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.activeRepertoire ? (
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold leading-none tabular-nums">{repertoireSongs}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">canciones en el set</p>
                </div>
                <Link href="/repertoires" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  Ver repertorio
                </Link>
              </div>
            ) : (
              <EmptyLine text="Activa un repertorio para verlo aquí." href="/repertoires" action="Ir a repertorios" />
            )}
          </CardContent>
        </Card>

        {/* Último setlist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Último setlist</CardTitle>
            <CardDescription>
              {data.lastSetlist?.event
                ? `Vinculado a ${data.lastSetlist.event.title}`
                : "Trabajo reciente"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.lastSetlist ? (
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{data.lastSetlist.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.lastSetlist.items.length} bloques
                  </p>
                </div>
                <Link
                  href={`/setlists/${data.lastSetlist.id}`}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Abrir
                </Link>
              </div>
            ) : (
              <EmptyLine text="Aún no hay setlists." href="/setlists" action="Crear setlist" />
            )}
          </CardContent>
        </Card>

        {/* Stock bajo */}
        {data.stockAlerts.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-punk-red" aria-hidden="true" />
                Stock bajo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {data.stockAlerts.map((alert) => (
                <div key={alert.name} className="rounded-lg px-3 py-2 text-sm ring-1 ring-foreground/10">
                  <p className="font-medium">{alert.name}</p>
                  <p className="text-muted-foreground">
                    {alert.stock} uds (mín. {alert.minStock})
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pedidos recientes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Pedidos recientes</CardTitle>
            <CardDescription>
              Ingresos recientes: {data.stats.recentRevenueFormatted}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentOrders.length === 0 ? (
              <EmptyLine text="Aún no hay pedidos." href="/orders/quick-sale" action="Venta rápida" />
            ) : (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/orders"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/60"
                >
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(order.createdAt, "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">
                      {centsToEuros(order.totalCents)}
                    </span>
                    <StatusBadge kind="order" status={order.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Archivos nuevos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archivos nuevos</CardTitle>
            <CardDescription>Biblioteca de la banda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recentFiles.length === 0 ? (
              <EmptyLine text="Sin archivos recientes." href="/files" action="Ir a archivos" />
            ) : (
              data.recentFiles.map((file) => (
                <Link
                  key={file.id}
                  href="/files"
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/60"
                >
                  <FileAudio className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(file.createdAt, "d MMM", { locale: es })}
                      {file.uploadedBy.profile?.name
                        ? ` · ${file.uploadedBy.profile.name}`
                        : ""}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Caja */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4 text-muted-foreground" aria-hidden="true" />
              Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold leading-none tabular-nums">
              {data.stats.recentRevenueFormatted}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              cobrado en pedidos recientes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyLine({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <div className="rounded-lg border border-dashed p-4 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link
        href={href}
        className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {action}
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <DashboardContent />
    </Suspense>
  );
}
