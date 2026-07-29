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
  ListMusic,
  Music2,
  Package,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { LoadingGrid } from "@/components/shared/loading-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Countdown } from "@/components/punk/countdown";
import { Equalizer } from "@/components/punk/equalizer";
import { NfpSeal } from "@/components/punk/nfp-seal";
import { Stamp } from "@/components/punk/stamp";
import { StatBlock } from "@/components/punk/stat-block";
import { Tape } from "@/components/punk/tape";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { centsToEuros } from "@/lib/money";
import { cn } from "@/lib/utils";

const quickActions = [
  { href: "/events/new", label: "Nuevo evento", icon: CalendarPlus, rotate: "-rotate-2" },
  { href: "/songs/new", label: "Nueva canción", icon: Music2, rotate: "rotate-1" },
  { href: "/setlists", label: "Nuevo setlist", icon: ListMusic, rotate: "-rotate-1" },
  { href: "/tasks", label: "Nueva tarea", icon: ClipboardList, rotate: "rotate-2" },
  { href: "/orders/quick-sale", label: "Venta rápida", icon: Zap, rotate: "-rotate-2" },
];

async function DashboardContent() {
  const data = await getDashboardData();
  const nextEvent = data.nextConcert ?? data.nextRehearsal ?? data.upcomingEvents[0] ?? null;
  const repertoireSongs = data.activeRepertoire?.songs.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero editorial: nombre de banda + sello NFP + cuenta atrás */}
      <section className="torn-bottom relative overflow-hidden rounded-xl border-2 bg-sidebar text-sidebar-foreground shadow-poster">
        <div className="halftone pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden="true" />
        <Tape className="absolute -top-1 left-8 z-10 -rotate-6" />
        <Tape className="absolute -top-1 right-10 z-10 rotate-3" />

        <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Stamp tone="red">Centro de operaciones</Stamp>
              <Equalizer className="text-sidebar-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-6xl">
                Hola, {data.user.name}
              </h1>
              <p className="font-punk text-xl text-sidebar-primary sm:text-2xl">
                La banda, en marcha.
              </p>
            </div>

            {nextEvent ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Próximo evento:{" "}
                  <Link
                    href={`/events/${nextEvent.id}`}
                    className="font-medium text-sidebar-foreground underline-offset-4 hover:underline"
                  >
                    {nextEvent.title}
                  </Link>{" "}
                  · {format(nextEvent.startAt, "EEEE d MMM, HH:mm", { locale: es })}
                  {nextEvent.venue ? ` · ${nextEvent.venue}` : ""}
                </p>
                <Countdown target={nextEvent.startAt.toISOString()} />
              </div>
            ) : (
              <p className="max-w-md text-sm text-muted-foreground">
                No hay nada en el calendario. Crea el próximo concierto o ensayo
                y empieza la cuenta atrás.
              </p>
            )}
          </div>

          <NfpSeal
            spin
            className="hidden h-56 w-56 justify-self-center drop-shadow-[0_10px_28px_rgba(0,0,0,0.6)] lg:block xl:h-72 xl:w-72"
          />
        </div>
      </section>

      {/* Atajos: pegatinas de creación rápida */}
      <nav aria-label="Acciones rápidas" className="flex flex-wrap gap-3">
        {quickActions.map(({ href, label, icon: Icon, rotate }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-md border-2 bg-card px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest shadow-poster-sm transition-all hover:-translate-y-1 hover:rotate-0 hover:shadow-poster-red focus-visible:rotate-0",
              rotate,
            )}
          >
            <span className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground transition-transform group-hover:rotate-6">
              <Icon className="size-4" />
            </span>
            {label}
          </Link>
        ))}
      </nav>

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

      {/* Rejilla fanzine: tarjetas de distinto peso */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Próximos eventos */}
        <Card className="card-lift lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">Próximos eventos</CardTitle>
            <CardDescription>Agenda confirmada y borradores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingEvents.length === 0 ? (
              <EmptyLine text="No hay eventos próximos. ¿Montamos algo?" href="/events/new" action="Crear evento" />
            ) : (
              data.upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
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

        {/* Asistencias pendientes */}
        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">Tu asistencia</CardTitle>
            <CardDescription>Confirmaciones pendientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingAttendances.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todo confirmado. Buen trabajo.
              </p>
            ) : (
              data.pendingAttendances.map((attendance) => (
                <Link
                  key={attendance.id}
                  href={`/events/${attendance.eventId}`}
                  className="flex items-center justify-between rounded-md border border-primary/40 p-3 transition-colors hover:bg-primary/10"
                >
                  <div>
                    <p className="font-medium">{attendance.event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(attendance.event.startAt, "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                  <Stamp tone="red" className="text-[10px]">Pendiente</Stamp>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tareas urgentes */}
        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">Mis tareas</CardTitle>
            <CardDescription>Pendientes y en curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingTasks.length === 0 ? (
              <EmptyLine text="Sin tareas pendientes." href="/tasks" action="Ver tareas" />
            ) : (
              data.pendingTasks.map((task) => (
                <Link
                  key={task.id}
                  href="/tasks"
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
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

        {/* Estado del repertorio */}
        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">Repertorio</CardTitle>
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
                  <p className="font-display text-4xl leading-none tabular-nums">{repertoireSongs}</p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                    canciones en el set
                  </p>
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
        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">Último setlist</CardTitle>
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
                  <p className="font-medium">{data.lastSetlist.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
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
          <Card className="card-lift border-destructive/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display uppercase tracking-wide">
                <AlertTriangle className="size-4 text-punk-red" />
                Stock bajo
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {data.stockAlerts.map((alert) => (
                <div key={alert.name} className="rounded-md border px-3 py-2 text-sm">
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
        <Card className="card-lift lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">Pedidos recientes</CardTitle>
            <CardDescription>
              Ingresos recientes: {data.stats.recentRevenueFormatted}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentOrders.length === 0 ? (
              <EmptyLine text="Aún no hay pedidos." href="/orders/quick-sale" action="Venta rápida" />
            ) : (
              data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href="/orders"
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
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
        <Card className="card-lift">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">Archivos nuevos</CardTitle>
            <CardDescription>Biblioteca de la banda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentFiles.length === 0 ? (
              <EmptyLine text="Sin archivos recientes." href="/files" action="Ir a archivos" />
            ) : (
              data.recentFiles.map((file) => (
                <Link
                  key={file.id}
                  href="/files"
                  className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <FileAudio className="size-4 shrink-0 text-muted-foreground" />
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

        {/* Ingresos con sello */}
        <Card className="card-lift border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display uppercase tracking-wide">
              <ShoppingCart className="size-4 text-primary" />
              Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl leading-none text-punk-acid tabular-nums">
              {data.stats.recentRevenueFormatted}
            </p>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
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
    <div className="rounded-md border border-dashed p-4 text-center">
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
