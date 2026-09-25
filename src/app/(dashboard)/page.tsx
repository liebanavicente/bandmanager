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
import { StageLights } from "@/components/art/stage-lights";
import { Vinyl } from "@/components/art/vinyl";
import { Waveform } from "@/components/art/waveform";
import { Countdown } from "@/components/punk/countdown";
import { StatBlock } from "@/components/punk/stat-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { centsToEuros } from "@/lib/money";
import { BAND_NAME } from "@/lib/workspace";

async function DashboardContent() {
  const data = await getDashboardData();
  const nextEvent = data.nextConcert ?? data.nextRehearsal ?? data.upcomingEvents[0] ?? null;
  const repertoireSongs = data.activeRepertoire?.songs.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Portada: cartel del próximo show */}
      <section
        aria-labelledby="next-show-title"
        className="stage-surface grain relative isolate overflow-hidden rounded-2xl p-6 shadow-poster sm:p-8 lg:p-10"
      >
        <StageLights />
        <Vinyl
          spin
          label={BAND_NAME}
          className="pointer-events-none absolute -right-24 -top-16 -z-10 size-72 opacity-35 sm:opacity-80 sm:-right-16 sm:size-96 lg:-right-10 lg:top-1/2 lg:size-[26rem] lg:-translate-y-1/2"
        />

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-2xl italic text-white/85 sm:text-3xl">
              Hola, {data.user.name.split(" ")[0]}.
            </p>
            <Button render={<Link href="/events/new" />} size="lg">
              <CalendarPlus />
              Crear evento
            </Button>
          </div>

          {nextEvent ? (
            <div className="grid gap-6 lg:max-w-[62%] lg:grid-cols-[auto_1fr] lg:items-end lg:gap-8">
              {/* Bloque de fecha, como en un cartel */}
              <div className="flex items-end gap-3 lg:flex-col lg:items-start lg:gap-0">
                <span className="poster-title text-[5.5rem] text-stage-gradient sm:text-[7rem]">
                  {format(nextEvent.startAt, "dd")}
                </span>
                <span className="pb-2 font-mono text-xs uppercase tracking-[0.25em] text-white/70 lg:pb-0">
                  {format(nextEvent.startAt, "MMM yyyy", { locale: es })}
                  <br />
                  {format(nextEvent.startAt, "EEEE · HH:mm", { locale: es })}
                </span>
              </div>

              <div className="min-w-0 space-y-3">
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-stage-amber">
                  <span className="size-1.5 animate-live rounded-full bg-stage-red" aria-hidden="true" />
                  Próximo show
                </p>
                <h2 id="next-show-title" className="poster-title break-words text-4xl text-white sm:text-6xl">
                  <Link href={`/events/${nextEvent.id}`} className="underline-offset-8 hover:underline">
                    {nextEvent.title}
                  </Link>
                </h2>
                {nextEvent.venue && (
                  <p className="font-serif text-xl italic text-white/75">en {nextEvent.venue}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-xl space-y-3">
              <h2 id="next-show-title" className="poster-title text-5xl text-white sm:text-6xl">
                Escenario <span className="text-stage-gradient">vacío</span>
              </h2>
              <p className="font-serif text-xl italic text-white/75">
                No hay nada en el calendario. Crea el próximo concierto o ensayo y
                empieza la cuenta atrás.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-5 border-t border-white/10 pt-6 lg:max-w-[62%] lg:flex-row lg:items-center lg:justify-between">
            {nextEvent ? (
              <Countdown target={nextEvent.startAt.toISOString()} tone="stage" />
            ) : (
              <span />
            )}
            <Waveform
              seed={nextEvent?.title ?? "silencio"}
              bars={56}
              progress={0.35}
              className="h-10 text-white lg:max-w-56"
            />
          </div>
        </div>
      </section>

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
        <Card className="stage-edge lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Próximos eventos</CardTitle>
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
                  className="group/row flex items-center gap-4 rounded-lg px-3 py-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-muted/60"
                >
                  {/* Fecha tipo entrada de gira */}
                  <div className="flex w-12 shrink-0 flex-col items-center border-r border-dashed border-foreground/15 pr-3 text-center">
                    <span className="font-display text-2xl leading-none group-hover/row:text-primary">
                      {format(event.startAt, "dd")}
                    </span>
                    <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {format(event.startAt, "MMM", { locale: es })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {format(event.startAt, "EEEE, HH:mm", { locale: es })}
                      {event.venue ? (
                        <span className="font-serif text-sm italic"> · {event.venue}</span>
                      ) : null}
                    </p>
                  </div>
                  <StatusBadge kind="event" status={event.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Asistencias pendientes */}
        <Card className="stage-edge">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tu asistencia</CardTitle>
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
        <Card className="stage-edge">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Mis tareas</CardTitle>
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
        <Card className="stage-edge">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Repertorio</CardTitle>
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
                  <p className="font-display text-5xl leading-none tabular-nums">{repertoireSongs}</p>
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
        <Card className="stage-edge">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Último setlist</CardTitle>
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
          <Card className="stage-edge lg:col-span-2">
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
        <Card className="stage-edge lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pedidos recientes</CardTitle>
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
        <Card className="stage-edge">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Archivos nuevos</CardTitle>
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
        <Card className="stage-edge">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="size-4 text-muted-foreground" aria-hidden="true" />
              Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-5xl leading-none tabular-nums text-stage-gradient">
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
