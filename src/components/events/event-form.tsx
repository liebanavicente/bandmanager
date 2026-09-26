"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import type { Event, EventStatus, EventType } from "@prisma/client";
import { toast } from "sonner";
import { createEvent, updateEvent } from "@/actions/events";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const eventTypes: Array<{ value: EventType; label: string }> = [
  { value: "CONCERT", label: "Concierto" },
  { value: "REHEARSAL", label: "Ensayo" },
  { value: "RECORDING", label: "Grabación" },
  { value: "MEETING", label: "Reunión" },
  { value: "PROMO", label: "Promo" },
  { value: "OTHER", label: "Otro" },
];

const eventStatuses: Array<{ value: EventStatus; label: string }> = [
  { value: "DRAFT", label: "Borrador" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "COMPLETED", label: "Completado" },
  { value: "CANCELLED", label: "Cancelado" },
];

type EventFormProps = {
  event?: Pick<
    Event,
    | "id"
    | "title"
    | "type"
    | "status"
    | "startAt"
    | "endAt"
    | "venue"
    | "address"
    | "mapsUrl"
    | "description"
    | "contactName"
    | "contactPhone"
    | "expectedFeeCents"
  >;
};

/** Valor para <input type="datetime-local"> en la hora local del navegador. */
function toLocalInput(date?: Date | null) {
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : undefined;
}

/** datetime-local no lleva zona: se interpreta en local y se envía en ISO. */
function toIso(value: FormDataEntryValue | null) {
  const text = (value as string) || "";
  return text ? new Date(text).toISOString() : undefined;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<EventType>(event?.type ?? "CONCERT");
  const [status, setStatus] = useState<EventStatus>(event?.status ?? "DRAFT");
  const isEdit = Boolean(event);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const text = (key: string) => (formData.get(key) as string) ?? "";
    const fee = text("expectedFee");
    const payload = {
      title: text("title"),
      type,
      status,
      startAt: toIso(formData.get("startAt")),
      endAt: toIso(formData.get("endAt")),
      venue: text("venue"),
      address: text("address"),
      mapsUrl: text("mapsUrl"),
      description: text("description"),
      contactName: text("contactName"),
      contactPhone: text("contactPhone"),
      expectedFeeCents: fee ? Math.round(Number(fee) * 100) : undefined,
    };

    const result = event ? await updateEvent({ id: event.id, ...payload }) : await createEvent(payload);

    setLoading(false);

    if (!("success" in result) || !result.success) {
      toast.error("error" in result ? result.error : "Error al guardar el evento");
      return;
    }

    toast.success(isEdit ? "Evento actualizado" : "Evento creado");
    router.push(`/events/${result.data.id}`);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Concierto en Sala X" required defaultValue={event?.title} />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <OptionSelect value={type} onValueChange={setType} options={eventTypes} aria-label="Tipo" />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <OptionSelect value={status} onValueChange={setStatus} options={eventStatuses} aria-label="Estado" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startAt">Inicio</Label>
            <Input id="startAt" name="startAt" type="datetime-local" required defaultValue={toLocalInput(event?.startAt)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endAt">Fin</Label>
            <Input id="endAt" name="endAt" type="datetime-local" required defaultValue={toLocalInput(event?.endAt)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Sala / lugar</Label>
            <Input id="venue" name="venue" placeholder="Sala, estudio, local…" defaultValue={event?.venue ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" name="address" defaultValue={event?.address ?? ""} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mapsUrl">Enlace al mapa</Label>
            <Input id="mapsUrl" name="mapsUrl" type="url" placeholder="https://maps.google.com/…" defaultValue={event?.mapsUrl ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contacto</Label>
            <Input id="contactName" name="contactName" defaultValue={event?.contactName ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Teléfono de contacto</Label>
            <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={event?.contactPhone ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedFee">Caché previsto (€)</Label>
            <Input
              id="expectedFee"
              name="expectedFee"
              type="number"
              min={0}
              step="0.01"
              defaultValue={event?.expectedFeeCents != null ? event.expectedFeeCents / 100 : undefined}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Notas, rider, contacto…"
              rows={4}
              defaultValue={event?.description ?? ""}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear evento"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
