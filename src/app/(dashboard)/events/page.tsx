import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Plus } from "lucide-react";
import type { EventStatus, EventType } from "@prisma/client";
import { listEvents } from "@/actions/events";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { auth } from "@/lib/auth";

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
    <div className="grid gap-4">
      {events.map((event) => (
        <Link key={event.id} href={`/events/${event.id}`}>
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{event.title}</h3>
                  <StatusBadge kind="event" status={event.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {eventTypeLabels[event.type]} ·{" "}
                  {format(event.startAt, "EEEE d MMM yyyy, HH:mm", { locale: es })}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{event.attendances.length} asistencias</span>
                <span>{event._count.setlists} setlists</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
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
          <Button render={<Link href="/events/new" />}>
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