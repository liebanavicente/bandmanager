import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Plus } from "lucide-react";
import type { EventStatus, EventType } from "@prisma/client";
import { listEvents } from "@/actions/events";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityActions } from "@/components/shared/entity-actions";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { ListPanel, ListRow } from "@/components/shared/list-panel";

const eventTypeLabels: Record<EventType, string> = {
  CONCERT: "Concierto",
  REHEARSAL: "Ensayo",
  RECORDING: "Grabación",
  MEETING: "Reunión",
  PROMO: "Promo",
  OTHER: "Otro",
};

const eventStatusOptions = [
  { value: "DRAFT", label: "Borrador" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "COMPLETED", label: "Completado" },
];

const eventTypeOptions = Object.entries(eventTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

async function EventsList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: EventStatus; type?: EventType }>;
}) {
  const params = await searchParams;
  const result = await listEvents({
    search: params.q,
    status: params.status,
    type: params.type,
  });

  if (!isActionSuccess(result)) {
    return (
      <p className="text-sm text-destructive">{result.error}</p>
    );
  }

  const events = result.data.items;

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sin eventos"
        description="Crea tu primer concierto, ensayo o sesión de grabación."
        action={{ label: "Crear evento", href: "/events/new" }}
      />
    );
  }

  return (
    <ListPanel>
      {events.map((event) => (
        <ListRow
          key={event.id}
          href={`/events/${event.id}`}
          leading={
            /* Fecha tipo entrada de gira */
            <div className="flex w-14 shrink-0 flex-col items-center border-r border-hairline pr-4 text-center group-hover:border-white/20">
              <span className="font-display text-4xl leading-none transition-colors group-hover:text-band-bright">
                {format(event.startAt, "dd")}
              </span>
              <span className="mt-1 text-[10px] font-extrabold uppercase text-muted-foreground">
                {format(event.startAt, "MMM yy", { locale: es })}
              </span>
            </div>
          }
          title={event.title}
          badges={<StatusBadge kind="event" status={event.status} />}
          meta={
            <>
              {eventTypeLabels[event.type]} · {format(event.startAt, "EEEE, HH:mm", { locale: es })}
              {event.venue ? <span className="font-serif italic"> · {event.venue}</span> : null}
            </>
          }
          trailing={
            <>
              <span>{event.attendances.length} asistencias</span>
              <span>{event._count.setlists} setlists</span>
            </>
          }
          actions={
            <EntityActions entity="event" id={event.id} name={event.title} editHref={`/events/${event.id}/edit`} />
          }
        />
      ))}
    </ListPanel>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: EventStatus; type?: EventType }>;
}) {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eventos"
        description="Calendario de conciertos, ensayos y actividades."
      >
        {isAdmin && (
          <Button nativeButton={false} render={<Link href="/events/new" />}>
            <Plus />
            Nuevo evento
          </Button>
        )}
      </PageHeader>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <SearchFilters
          searchPlaceholder="Buscar por título o venue…"
          statusOptions={eventStatusOptions}
          typeOptions={eventTypeOptions}
        />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <EventsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}