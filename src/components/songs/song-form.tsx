"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Song, SongStatus } from "@prisma/client";
import { toast } from "sonner";
import { createSong, updateSong } from "@/actions/songs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionSelect } from "@/components/shared/option-select";
import { Textarea } from "@/components/ui/textarea";

type SongFormProps = {
  /** Si se pasa, el formulario edita esta canción en lugar de crear una. */
  song?: Pick<
    Song,
    | "id"
    | "title"
    | "artist"
    | "status"
    | "durationSeconds"
    | "keySignature"
    | "tempo"
    | "timeSignature"
    | "leadVocal"
    | "instruments"
    | "tags"
    | "referenceUrl"
    | "technicalNotes"
    | "lyrics"
  >;
};

const songStatusLabels: Record<SongStatus, string> = {
  PROPOSED: "Propuesta",
  IN_PREPARATION: "En preparación",
  REHEARSED: "Ensayada",
  READY: "Lista",
  ARCHIVED: "Archivada",
};

const songStatusOptions = Object.entries(songStatusLabels).map(([value, label]) => ({
  value: value as SongStatus,
  label,
}));

export function SongForm({ song }: SongFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SongStatus>(song?.status ?? "PROPOSED");
  const isEdit = Boolean(song);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const text = (key: string) => (formData.get(key) as string) ?? "";
    const durationMin = Number(formData.get("durationMin") || 0);
    const durationSec = Number(formData.get("durationSec") || 0);

    const payload = {
      title: text("title"),
      artist: text("artist"),
      keySignature: text("keySignature"),
      tempo: Number(formData.get("tempo") || 0) || undefined,
      timeSignature: text("timeSignature"),
      leadVocal: text("leadVocal"),
      instruments: text("instruments"),
      referenceUrl: text("referenceUrl"),
      technicalNotes: text("technicalNotes"),
      lyrics: text("lyrics"),
      status,
      durationSeconds: durationMin * 60 + durationSec || undefined,
      tags: text("tags")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const result = song ? await updateSong({ id: song.id, ...payload }) : await createSong(payload);

    setLoading(false);

    if (!("success" in result) || !result.success) {
      toast.error("error" in result ? result.error : "Error al guardar la canción");
      return;
    }

    toast.success(isEdit ? "Canción actualizada" : "Canción creada");
    // push ya carga la ficha en fresco (una refresh() posterior cancelaría la navegación)
    router.push(`/songs/${result.data.id}`);
  }

  const minutes = song?.durationSeconds ? Math.floor(song.durationSeconds / 60) : undefined;
  const seconds = song?.durationSeconds ? song.durationSeconds % 60 : undefined;

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required defaultValue={song?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Artista</Label>
            <Input id="artist" name="artist" defaultValue={song?.artist ?? ""} />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <OptionSelect
              value={status}
              onValueChange={setStatus}
              options={songStatusOptions}
              aria-label="Estado"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMin">Duración (min)</Label>
            <Input id="durationMin" name="durationMin" type="number" min={0} defaultValue={minutes} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationSec">Duración (seg)</Label>
            <Input id="durationSec" name="durationSec" type="number" min={0} max={59} defaultValue={seconds} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keySignature">Tonalidad</Label>
            <Input id="keySignature" name="keySignature" placeholder="Ej. Em" defaultValue={song?.keySignature ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tempo">Tempo (BPM)</Label>
            <Input id="tempo" name="tempo" type="number" min={0} defaultValue={song?.tempo ?? undefined} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeSignature">Compás</Label>
            <Input id="timeSignature" name="timeSignature" placeholder="4/4" defaultValue={song?.timeSignature ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadVocal">Voz principal</Label>
            <Input id="leadVocal" name="leadVocal" defaultValue={song?.leadVocal ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="instruments">Instrumentos</Label>
            <Input id="instruments" name="instruments" placeholder="Guitarra, bajo, batería…" defaultValue={song?.instruments ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <Input id="tags" name="tags" placeholder="rock, cover, single…" defaultValue={song?.tags.join(", ")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="referenceUrl">Referencia (URL)</Label>
            <Input id="referenceUrl" name="referenceUrl" type="url" placeholder="https://…" defaultValue={song?.referenceUrl ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="technicalNotes">Notas técnicas</Label>
            <Textarea id="technicalNotes" name="technicalNotes" rows={3} defaultValue={song?.technicalNotes ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="lyrics">Letra</Label>
            <Textarea id="lyrics" name="lyrics" rows={6} defaultValue={song?.lyrics ?? ""} />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {isEdit ? "Guardar cambios" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
