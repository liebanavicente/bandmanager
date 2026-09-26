"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createRepertoire, setActiveRepertoire, updateRepertoire } from "@/actions/repertoires";
import { EntityActions } from "@/components/shared/entity-actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { newTrack, TrackEditor, type SongChoice, type Track } from "@/components/music/track-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type RepertoireDraft = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  isActive: boolean;
  songIds: string[];
};

type RepertoireDialogProps = {
  repertoire?: RepertoireDraft;
  songs: SongChoice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RepertoireDialog({ repertoire, songs, open, onOpenChange }: RepertoireDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(repertoire?.isActive ?? false);
  const [tracks, setTracks] = useState<Track[]>(() =>
    (repertoire?.songIds ?? []).map((songId) => newTrack({ type: "SONG", songId })),
  );

  async function handleSubmit(form: FormData) {
    setLoading(true);
    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      notes: String(form.get("notes") ?? ""),
      songIds: tracks.flatMap((t) => (t.songId ? [t.songId] : [])),
    };
    const result = repertoire
      ? await updateRepertoire({ id: repertoire.id, ...payload })
      : await createRepertoire(payload);

    if ("error" in result) {
      setLoading(false);
      toast.error(result.error);
      return;
    }
    if (active && !repertoire?.isActive) {
      const activation = await setActiveRepertoire({ id: result.data.id });
      if ("error" in activation) toast.error(activation.error);
    }
    setLoading(false);
    toast.success(repertoire ? "Repertorio actualizado" : "Repertorio creado");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      kicker={repertoire ? "Editar repertorio" : "Nuevo repertorio"}
      title={repertoire ? repertoire.name : "Monta el repertorio"}
      submitLabel={repertoire ? "Guardar cambios" : "Crear repertorio"}
      loading={loading}
      onSubmit={handleSubmit}
      className="sm:max-w-xl"
    >
      <div className="space-y-2">
        <Label htmlFor="r-name">Nombre</Label>
        <Input id="r-name" name="name" required defaultValue={repertoire?.name} placeholder="Gira 2026" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-description">Descripción</Label>
        <Input id="r-description" name="description" defaultValue={repertoire?.description ?? ""} />
      </div>
      <div className="space-y-2">
        <Label>Canciones</Label>
        <TrackEditor songs={songs} tracks={tracks} onChange={setTracks} uniqueSongs />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-notes">Notas</Label>
        <Textarea id="r-notes" name="notes" rows={2} defaultValue={repertoire?.notes ?? ""} />
      </div>
      <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
        <span>
          <span className="block text-sm font-medium">Repertorio activo</span>
          <span className="block text-xs text-muted-foreground">Es el que aparece en el panel. Solo puede haber uno.</span>
        </span>
        <Switch checked={active} onCheckedChange={setActive} disabled={repertoire?.isActive} />
      </label>
    </FormDialog>
  );
}

export function NewRepertoireButton({ songs }: { songs: SongChoice[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo repertorio
      </Button>
      {open && <RepertoireDialog songs={songs} open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function RepertoireActions({
  repertoire,
  songs,
  variant = "menu",
}: {
  repertoire: RepertoireDraft;
  songs: SongChoice[];
  variant?: "menu" | "buttons";
}) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <EntityActions
        entity="repertoire"
        id={repertoire.id}
        name={repertoire.name}
        onEdit={() => setEditing(true)}
        canDelete={!repertoire.isActive}
        variant={variant}
        redirectAfterDelete={variant === "buttons"}
      />
      {editing && (
        <RepertoireDialog repertoire={repertoire} songs={songs} open={editing} onOpenChange={setEditing} />
      )}
    </>
  );
}
