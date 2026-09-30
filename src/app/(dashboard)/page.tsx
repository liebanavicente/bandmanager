import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CalendarPlus,
  ClipboardList,
  FileAudio,
  Music2,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { LoadingGrid } from "@/components/shared/loading-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { BackgroundVideo } from "@/components/art/background-video";
import { StageLights } from "@/components/art/stage-lights";
import { Waveform } from "@/components/art/waveform";
import { Countdown } from "@/components/punk/countdown";
import { StatBlock } from "@/components/punk/stat-block";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { glassCard, glassRow } from "@/components/glass/glass";
import { StageGlow } from "@/components/glass/stage-glow";
import { cn } from "@/lib/utils";
import { centsToEuros } from "@/lib/money";
import { getBandSummary } from "@/lib/workspace";

async function DashboardContent() {
  const data = await getDashboardData();
  const band = await getBandSummary(data.user.bandId);
  const nextEvent = data.nextConcert ?? data.nextRehearsal ?? data.upcomingEvents[0] ?? null;
  const repertoireSongs = data.activeRepertoire?.songs.length ?? 0;

  return (
    <div className="relative isolate space-y-6">
      <StageGlow />
      {/* Portada: cartel del próximo show */}
      <section
        aria-labelledby="next-show-title"
        className="stage-surface grain relative isolate overflow-hidden rounded-2xl p-6 shadow-poster sm:p-8 lg:p-10"
      >
        {/* Vídeo del vinilo, volteado para que el disco quede a la derecha */}
        <div aria-hidden="true" className="absolute inset-0 -z-20">
          <BackgroundVideo name="/video/bg-vinilo" className="absolute inset-0 size-full -scale-x-100 opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        </div>
        <StageLights />
        {/* Logo de la banda, grande y con su forma, donde el cartel deja hueco */}
        {band.logoData && (
          <div className="pointer-events-none absolute bottom-10 right-12 top-28 -z-10 hidden w-[26%] max-w-64 items-center justify-center lg:flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={band.logoData}
              alt={`Logo de ${band.name}`}
              className="max-h-full max-w-full object-contain drop-shadow-[0_0_40px_rgba(255,122,51,0.35)]"
            />
          </div>
        )}

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {band.logoData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={band.logoData} alt="" className="size-10 object-contain sm:size-12 lg:hidden" />
              )}
              <p className="font-serif text-2xl italic text-white/85 sm:text-3xl">
                Hola, {data.user.name.split(" ")[0]}.
              </p>
            </div>
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
                  <span
                    className="size-1.5 animate-live rounded-full bg-stage-red"
                    aria-hidden="true"
                  />
                  Próximo show
                </p>
                <h2
                  id="next-show-title"
                  className="poster-title break-words text-4xl text-white sm:text-6xl"
                >
                  <Link
                    href={`/events/${nextEvent.id}`}
                    className="underline-offset-8 hover:underline"
                  >
                    {nextEvent.title}
                  </Link>
                </h2>
                {nextEvent.venue && (
                  <p className="font-serif text-xl italic text-white/75">en {nextEvent.venue}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-xl space-y-3 lg:max-w-[62%]">
              <h2 id="next-show-title" className="poster-title text-5xl text-white sm:text-6xl">
                Escenario <span className="text-stage-gradient">vacío</span>
              </h2>
              <p className="font-serif text-xl italic text-white/75">
                No hay nada en el calendario. Crea el próximo concierto o ensayo y empieza la cuenta
                atrás.
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

      {/* Cifras destacadas: cada una lleva a su sección */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatBlock
          label="Eventos este mes"
          value={data.stats.eventsThisMonth}
          icon={Calendar}
          href="/events"
        />
        <StatBlock
          label="Canciones listas"
          value={data.stats.songsReady}
          icon={Music2}
          accent="acid"
          href="/songs?status=READY"
        />
        <StatBlock
          label="Mis tareas"
          value={data.stats.pendingTasks}
          icon={ClipboardList}
          href="/tasks"
        />
        {band.hasStore && (
          <StatBlock
            label="Stock bajo"
            value={data.stats.lowStockProducts}
            icon={Package}
            accent={data.stats.lowStockProducts > 0 ? "red" : "none"}
            href="/products"
          />
        )}
      </div>

      {/* Rejilla principal */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Próximos eventos */}
        <DashCard
          title="Próximos eventos"
          description="Agenda confirmada y borradores"
          href="/events"
          className="lg:col-span-2"
        >
          {data.upcomingEvents.length === 0 ? (
            <EmptyLine
              text="No hay eventos próximos. ¿Montamos algo?"
              href="/events/new"
              action="Crear evento"
            />
          ) : (
            data.upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className={cn("group/row flex items-center gap-4 rounded-lg px-3 py-2.5", glassRow)}
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
        </DashCard>

        {/* Asistencias pendientes */}
        <DashCard title="Tu asistencia" description="Confirmaciones pendientes" href="/events">
          {data.pendingAttendances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todo confirmado. Buen trabajo.</p>
          ) : (
            data.pendingAttendances.map((attendance) => (
              <Link
                key={attendance.id}
                href={`/events/${attendance.eventId}`}
                className="flex items-center justify-between rounded-lg bg-punk-red/5 px-3 py-2.5 ring-1 ring-punk-red/25 transition-colors hover:bg-punk-red/10"
              >
                <div>
                  <p className="text-sm font-medium">{attendance.event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(attendance.event.startAt, "d MMM, HH:mm", {
                      locale: es,
                    })}
                  </p>
                </div>
                <StatusBadge kind="attendance" status="PENDING" />
              </Link>
            ))
          )}
        </DashCard>

        {/* Tareas */}
        <DashCard title="Mis tareas" description="Pendientes y en curso" href="/tasks">
          {data.pendingTasks.length === 0 ? (
            <EmptyLine text="Sin tareas pendientes." href="/tasks?new=1" action="Crear tarea" />
          ) : (
            data.pendingTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className={cn("flex items-center justify-between rounded-lg px-3 py-2.5", glassRow)}
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
        </DashCard>

        {/* Estado del repertorio: toda la tarjeta lleva a él */}
        <DashCard
          title="Repertorio"
          description={
            data.activeRepertoire ? `${data.activeRepertoire.name} · activo` : "Sin repertorio activo"
          }
          href={data.activeRepertoire ? `/repertoires/${data.activeRepertoire.id}` : "/repertoires"}
          whole
        >
          {data.activeRepertoire ? (
            <div>
              <p className="font-display text-5xl leading-none tabular-nums">{repertoireSongs}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">canciones en el set</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Activa un repertorio para verlo aquí.</p>
          )}
        </DashCard>

        {/* Último setlist: toda la tarjeta lo abre */}
        <DashCard
          title="Último setlist"
          description={
            data.lastSetlist?.event ? `Vinculado a ${data.lastSetlist.event.title}` : "Trabajo reciente"
          }
          href={data.lastSetlist ? `/setlists/${data.lastSetlist.id}` : "/setlists/new"}
          whole
        >
          {data.lastSetlist ? (
            <div>
              <p className="text-sm font-medium">{data.lastSetlist.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data.lastSetlist.items.length} bloques
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay setlists. Crea el primero.</p>
          )}
        </DashCard>

        {band.hasStore && (
          <>
            {/* Pedidos recientes */}
            <DashCard
              title="Pedidos recientes"
              description={`Ingresos recientes: ${data.stats.recentRevenueFormatted}`}
              href="/orders"
              className="lg:col-span-2"
            >
              {data.recentOrders.length === 0 ? (
                <EmptyLine text="Aún no hay pedidos." href="/orders/quick-sale" action="Venta rápida" />
              ) : (
                data.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/orders"
                    className={cn("flex items-center justify-between rounded-lg px-3 py-2.5", glassRow)}
                  >
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(order.createdAt, "d MMM yyyy", {
                          locale: es,
                        })}
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
            </DashCard>

          </>
        )}

        {/* Archivos nuevos: junto a los pedidos, o a lo ancho si no hay tienda */}
        <DashCard
          title="Archivos nuevos"
          description="Biblioteca de la banda"
          href="/files"
          className={cn(!band.hasStore && "lg:col-span-3")}
        >
          {data.recentFiles.length === 0 ? (
            <EmptyLine text="Sin archivos recientes." href="/files" action="Subir archivo" />
          ) : (
            <div className={cn("grid gap-2", !band.hasStore && "sm:grid-cols-2 lg:grid-cols-3")}>
              {data.recentFiles.map((file) => (
                <Link
                  key={file.id}
                  href="/files"
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5", glassRow)}
                >
                  <FileAudio className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(file.createdAt, "d MMM", { locale: es })}
                      {file.uploadedBy.profile?.name ? ` · ${file.uploadedBy.profile.name}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DashCard>

        {/* Stock bajo y caja, cerrando la rejilla */}
        {band.hasStore && data.stockAlerts.length > 0 && (
          <DashCard
            title="Stock bajo"
            href="/products"
            icon={AlertTriangle}
            iconClassName="text-punk-red"
            className="lg:col-span-2"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {data.stockAlerts.map((alert) => (
                <Link
                  key={alert.name}
                  href="/products"
                  className={cn("rounded-lg px-3 py-2 text-sm", glassRow)}
                >
                  <p className="font-medium">{alert.name}</p>
                  <p className="text-muted-foreground">
                    {alert.stock} uds (mín. {alert.minStock})
                  </p>
                </Link>
              ))}
            </div>
          </DashCard>
        )}
        {band.hasStore && (
          <DashCard
            title="Caja"
            description="Cobrado en pedidos recientes"
            href="/orders"
            icon={ShoppingCart}
            whole
            className={cn(data.stockAlerts.length === 0 && "lg:col-span-3")}
          >
            <p className="font-display text-5xl leading-none tabular-nums text-stage-gradient">
              {data.stats.recentRevenueFormatted}
            </p>
          </DashCard>
        )}
      </div>
    </div>
  );
}

type DashCardProps = {
  title: string;
  description?: string;
  href: string;
  icon?: LucideIcon;
  iconClassName?: string;
  /** Toda la tarjeta es el enlace (solo si no contiene otros enlaces). */
  whole?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Tarjeta de cristal del panel; su cabecera (o toda ella) lleva a la sección. */
function DashCard({ title, description, href, icon: Icon, iconClassName, whole, className, children }: DashCardProps) {
  const header = (
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base font-semibold">
        {Icon && <Icon className={cn("size-4 text-muted-foreground", iconClassName)} aria-hidden="true" />}
        {whole ? (
          title
        ) : (
          <Link href={href} className="underline-offset-4 hover:text-primary hover:underline">
            {title}
          </Link>
        )}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
      <CardAction>
        {whole ? (
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        ) : (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Ver todo
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </CardAction>
    </CardHeader>
  );

  const card = (
    <Card className={cn("stage-edge h-full", glassCard, !whole && className)}>
      {header}
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );

  if (!whole) return card;
  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      {card}
    </Link>
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
