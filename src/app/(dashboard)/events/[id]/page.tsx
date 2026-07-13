import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ExternalLink, ListMusic, MapPin } from "lucide-react";
import type { EventType } from "@prisma/client";
import { getEvent } from "@/actions/events";
import { AttendancePanel } from "@/components/events/attendance-panel";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";
import { centsToEuros } from "@/lib/money";

const eventTypeLabels: Record<EventType, string> = {
  CONCERT: "Concierto",
  REHEARSAL: "Ensayo",
  RECORDING: "Grabación",
  MEETING: "Reunión",
  PROMO: "Promo",
  OTHER: "Otro",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEvent(id);

  if (!isActionSuccess(result)) notFound();
  const event = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title={event.title} description={eventTypeLabels[event.type]}>
        <Button variant="outline" render={<Link href="/events" />}>
          <ArrowLeft />
          Volver
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <StatusBadge kind="event" status={event.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Inicio</p>
              <p className="font-medium">
                {format(event.startAt, "EEEE d MMM yyyy, HH:mm", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fin</p>
              <p className="font-medium">
                {format(event.endAt, "EEEE d MMM yyyy, HH:mm", { locale: es })}
              </p>
            </div>
            {event.venue && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Venue</p>
                <p className="flex items-center gap-1.5 font-medium">
                  <MapPin className="size-4 text-muted-foreground" />
                  {event.venue}
                  {event.address ? ` — ${event.address}` : ""}
                </p>
              </div>
            )}
            {event.callTime && (
              <div>
                <p className="text-xs text-muted-foreground">Call time</p>
                <p className="font-medium">
                  {format(event.callTime, "HH:mm", { locale: es })}
                </p>
              </div>
            )}
            {event.expectedFeeCents != null && (
              <div>
                <p className="text-xs text-muted-foreground">Caché previsto</p>
                <p className="font-medium">{centsToEuros(event.expectedFeeCents)}</p>
              </div>
            )}
            {event.description && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Descripción</p>
                <p className="text-sm">{event.description}</p>
              </div>
            )}
            {event.mapsUrl && (
              <div className="sm:col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a href={event.mapsUrl} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <ExternalLink />
                  Ver en mapa
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListMusic className="size-4" />
              Setlists
            </CardTitle>
            <CardDescription>{event.setlists.length} vinculadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {event.setlists.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin setlists aún.</p>
            ) : (
              event.setlists.map((setlist) => (
                <Link
                  key={setlist.id}
                  href={`/setlists/${setlist.id}`}
                  className="block rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  {setlist.name}
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asistencia</CardTitle>
          <CardDescription>Confirma quién estará presente</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendancePanel eventId={event.id} attendances={event.attendances} />
        </CardContent>
      </Card>
    </div>
  );
}