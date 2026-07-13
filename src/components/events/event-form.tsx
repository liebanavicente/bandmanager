"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { EventStatus, EventType } from "@prisma/client";
import { toast } from "sonner";
import { createEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const eventTypes: Array<{ value: EventType; label: string }> = [
  { value: "CONCERT", label: "Concierto" },
  { value: "REHEARSAL", label: "Ensayo" },
  { value: "RECORDING", label: "Grabación" },
  { value: "MEETING", label: "Reunión" },
  { value: "PROMO", label: "Promo" },
  { value: "OTHER", label: "Otro" },
];

export function EventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<EventType>("CONCERT");
  const [status, setStatus] = useState<EventStatus>("DRAFT");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createEvent({
      title: formData.get("title") as string,
      type,
      status,
      startAt: formData.get("startAt") as string,
      endAt: formData.get("endAt") as string,
      venue: (formData.get("venue") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
    });

    setLoading(false);

    if (!("success" in result) || !result.success) {
      toast.error("error" in result ? result.error : "Error al crear evento");
      return;
    }

    toast.success("Evento creado");
    router.push(`/events/${result.data.id}`);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Concierto en Sala X" required />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startAt">Inicio</Label>
            <Input id="startAt" name="startAt" type="datetime-local" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endAt">Fin</Label>
            <Input id="endAt" name="endAt" type="datetime-local" required />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" name="venue" placeholder="Sala, estudio, local…" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Notas, rider, contacto…"
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Crear evento
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}