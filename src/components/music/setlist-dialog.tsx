"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import type { SetlistItemType } from "@prisma/client";
import { toast } from "sonner";
import { createSetlist, updateSetlist } from "@/actions/setlists";
import { EntityActions } from "@/components/shared/entity-actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { OptionSelect } from "@/components/shared/option-select";
import { newTrack, TrackEditor, type SongChoice, type Track } from "@/components/music/track-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type EventChoice = { id: string; title: string; startAt: Date };

export type SetlistDraft = {
  id: string;
  name: string;
  notes: string | null;
  eventId: string | null;
  items: { type: SetlistItemType; songId: string | null; comment: string | null }[];
};

const NO_EVENT = "none";

type SetlistDialogProps = {
  setlist?: SetlistDraft;
  songs: SongChoice[];
  events: EventChoice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SetlistDialog({ setlist, songs, events, open, onOpenChange }: SetlistDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState(setlist?.eventId ?? NO_EVENT);
  const [tracks, setTracks] = useState<Track[]>(() =>
    (setlist?.items ?? []).map((item) =>
      newTrack({ type: item.type, songId: item.songId ?? undefined, comment: item.comment ?? undefined }),
    ),
  );

  const eventOptions = [
    { value: NO_EVENT, label: "Sin evento" },
    ...events.map((e) => ({
      value: e.id,
      label: `${e.title} · ${format(e.startAt, "d MMM yyyy", { locale: es })}`,
    })),
  ];

  async function handleSubmit(form: FormData) {
    setLoading(true);
    const payload = {
      name: String(form.get("name") ?? ""),
      notes: String(form.get("notes") ?? ""),
      eventId: eventId === NO_EVENT ? (setlist ? "" : undefined) : eventId,
      items: tracks
        .filter((t) => t.type !== "SONG" || t.songId)
        .map((t) => ({ type: t.type, songId: t.songId, comment: t.comment ?? "" })),
    };
    const result = setlist ? await updateSetlist({ id: setlist.id, ...payload }) : await createSetlist(payload);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(setlist ? "Setlist actualizado" : "Setlist creado");
    onOpenChange(false);
    if (!setlist) router.push(`/setlists/${result.data.id}`);
    else router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      kicker={setlist ? "Editar setlist" : "Nuevo setlist"}
      title={setlist ? setlist.name : "Orden del show"}
      submitLabel={setlist ? "Guardar cambios" : "Crear setlist"}
      loading={loading}
      onSubmit={handleSubmit}
      className="sm:max-w-xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="s-name">Nombre</Label>
          <Input id="s-name" name="name" required defaultValue={setlist?.name} placeholder="Setlist Sala Copérnico" />
        </div>
        <div className="space-y-2">
          <Label>Evento</Label>
          <OptionSelect value={eventId} onValueChange={setEventId} options={eventOptions} aria-label="Evento" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Orden</Label>
        <TrackEditor songs={songs} tracks={tracks} onChange={setTracks} allowMarkers />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s-notes">Notas</Label>
        <Textarea id="s-notes" name="notes" rows={2} defaultValue={setlist?.notes ?? ""} />
      </div>
    </FormDialog>
  );
}

export function NewSetlistButton({ songs, events }: { songs: SongChoice[]; events: EventChoice[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo setlist
      </Button>
      {open && <SetlistDialog songs={songs} events={events} open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function SetlistActions({
  setlist,
  songs,
  events,
  variant = "menu",
  defaultEditing = false,
}: {
  setlist: SetlistDraft;
  songs: SongChoice[];
  events: EventChoice[];
  variant?: "menu" | "buttons";
  /** Abre el editor al cargar (enlace "Editar" desde el listado). */
  defaultEditing?: boolean;
}) {
  const [editing, setEditing] = useState(defaultEditing);
  return (
    <>
      <EntityActions
        entity="setlist"
        id={setlist.id}
        name={setlist.name}
        onEdit={() => setEditing(true)}
        variant={variant}
        redirectAfterDelete={variant === "buttons"}
      />
      {editing && (
        <SetlistDialog setlist={setlist} songs={songs} events={events} open={editing} onOpenChange={setEditing} />
      )}
    </>
  );
}
