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
import { RecordDisc } from "@/components/art/record-disc";
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
import { cn } from "@/lib/utils";
import { centsToEuros } from "@/lib/money";
import { getBandSummary } from "@/lib/workspace";

async function DashboardContent() {
  const data = await getDashboardData();
  const band = await getBandSummary(data.user.bandId);
  const nextEvent = data.nextConcert ?? data.nextRehearsal ?? data.upcomingEvents[0] ?? null;
  const repertoireSongs = data.activeRepertoire?.songs.length ?? 0;

  return (
    <div className="relative isolate space-y-8">
      {/* Portada editorial: saludo, próximo show como titular y el disco de la banda */}
      <section aria-labelledby="next-show-title" className="relative">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0 space-y-4">
            {nextEvent ? (
              <p className="eyebrow flex w-fit items-center gap-2">
                <span className="size-1.5 animate-live rounded-full bg-band-ink" aria-hidden="true" />
                Próximo show · {format(nextEvent.startAt, "EEE d MMM · HH:mm", { locale: es })}
              </p>
            ) : (
              <p className="eyebrow">{[band.name, band.genre, band.city].filter(Boolean).join(" · ")}</p>
            )}
            <p className="font-serif text-2xl italic text-muted-foreground sm:text-3xl">
              Hola, {data.user.name.split(" ")[0]}.
            </p>
            {nextEvent ? (
              <h1 id="next-show-title" className="poster-title break-words text-5xl sm:text-7xl xl:text-8xl">
                <Link href={`/events/${nextEvent.id}`} className="decoration-band decoration-4 underline-offset-8 hover:underline">
                  {nextEvent.title}
                </Link>
                {nextEvent.venue && (
                  <span className="mt-2 block font-serif text-2xl normal-case italic leading-tight text-band-text sm:text-3xl">
                    en {nextEvent.venue}
                  </span>
                )}
              </h1>
            ) : (
              <>
                <h1 id="next-show-title" className="poster-title text-6xl sm:text-8xl">
                  Escenario <span className="text-stage-gradient">vacío</span>
                </h1>
                <p className="max-w-xl text-base text-muted-foreground">
                  No hay nada en el calendario. Crea el próximo concierto o ensayo y empieza la cuenta atrás.
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button render={<Link href="/events/new" />} nativeButton={false} size="lg" className="h-10 px-4">
                <CalendarPlus />
                Crear evento
              </Button>
              <Button render={<Link href="/events" />} nativeButton={false} variant="outline" size="lg" className="h-10 px-4">
                <Calendar />
                Ver agenda
              </Button>
            </div>
          </div>
          <RecordDisc
            logoData={band.logoData}
            label={band.name}
            className="hidden size-56 lg:block xl:size-64"
          />
        </div>
        <div className="rule mt-8" />
      </section>

      {/* Ticket del próximo show: fecha de cartel, cuenta atrás y la onda del tema */}
      {nextEvent && (
        <section
          aria-label="Cuenta atrás"
          className={cn("grid overflow-hidden rounded-xl sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_minmax(0,18rem)]", glassCard)}
        >
          <div className="flex items-end gap-3 border-b border-hairline p-6 sm:border-b-0 sm:border-r">
            <span className="poster-title text-8xl text-stage-gradient">{format(nextEvent.startAt, "dd")}</span>
            <span className="pb-2 text-xs font-extrabold uppercase leading-snug">
              {format(nextEvent.startAt, "MMMM yyyy", { locale: es })}
              <br />
              <span className="text-muted-foreground">{format(nextEvent.startAt, "EEEE · HH:mm", { locale: es })}</span>
            </span>
          </div>
          <div className="flex flex-col justify-center gap-2 p-6">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Faltan</p>
            <Countdown target={nextEvent.startAt.toISOString()} />
          </div>
          <div className="hidden flex-col justify-center gap-2 border-l border-hairline p-6 lg:flex">
            <p className="text-xs font-extrabold uppercase text-muted-foreground">Sonando</p>
            <Waveform seed={nextEvent.title} bars={44} progress={0.35} className="h-12 text-ink" />
          </div>
        </section>
      )}

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
                <div className="flex w-12 shrink-0 flex-col items-center border-r border-hairline pr-3 text-center">
                  <span className="font-display text-2xl leading-none group-hover/row:text-band-text">
                    {format(event.startAt, "dd")}
                  </span>
                  <span className="mt-0.5 text-[10px] font-extrabold uppercase text-muted-foreground">
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
                className="flex items-center justify-between rounded-lg bg-band/10 px-3 py-2.5 ring-1 ring-band/40 transition-colors hover:bg-band/20"
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
      <CardTitle className="poster-title flex items-center gap-2 text-2xl">
        {Icon && <Icon className={cn("size-4 text-muted-foreground", iconClassName)} aria-hidden="true" />}
        {whole ? (
          title
        ) : (
          <Link href={href} className="underline-offset-4 hover:text-band-text hover:underline">
            {title}
          </Link>
        )}
      </CardTitle>
      {description && <CardDescription className="text-[13px]">{description}</CardDescription>}
      <CardAction>
        {whole ? (
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-band-text"
            aria-hidden="true"
          />
        ) : (
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white/80 px-2.5 py-1 text-xs font-bold transition-colors hover:border-ink hover:bg-ink hover:text-band-bright"
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
        "group block rounded-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        className,
      )}
    >
      {card}
    </Link>
  );
}

function EmptyLine({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink/20 p-4 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link
        href={href}
        className="mt-2 inline-block text-sm font-bold text-band-text underline underline-offset-4 hover:text-ink"
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
