"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { SongStatus } from "@prisma/client";
import { toast } from "sonner";
import { createSong } from "@/actions/songs";
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

export function SongForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SongStatus>("PROPOSED");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const durationMin = Number(formData.get("durationMin") || 0);
    const durationSec = Number(formData.get("durationSec") || 0);
    const tagsRaw = (formData.get("tags") as string) || "";

    const result = await createSong({
      title: formData.get("title") as string,
      artist: (formData.get("artist") as string) || undefined,
      keySignature: (formData.get("keySignature") as string) || undefined,
      tempo: Number(formData.get("tempo") || 0) || undefined,
      status,
      durationSeconds: durationMin * 60 + durationSec || undefined,
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setLoading(false);

    if (!("success" in result) || !result.success) {
      toast.error("error" in result ? result.error : "Error al crear canción");
      return;
    }

    toast.success("Canción creada");
    router.push(`/songs/${result.data.id}`);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artist">Artista</Label>
            <Input id="artist" name="artist" />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as SongStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROPOSED">Propuesta</SelectItem>
                <SelectItem value="IN_PREPARATION">En preparación</SelectItem>
                <SelectItem value="REHEARSED">Ensayada</SelectItem>
                <SelectItem value="READY">Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationMin">Duración (min)</Label>
            <Input id="durationMin" name="durationMin" type="number" min={0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationSec">Duración (seg)</Label>
            <Input id="durationSec" name="durationSec" type="number" min={0} max={59} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keySignature">Tonalidad</Label>
            <Input id="keySignature" name="keySignature" placeholder="Ej. Em" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tempo">Tempo (BPM)</Label>
            <Input id="tempo" name="tempo" type="number" min={0} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <Input id="tags" name="tags" placeholder="rock, cover, single…" />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Guardar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}