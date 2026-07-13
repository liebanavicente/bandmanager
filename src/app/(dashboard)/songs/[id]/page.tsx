import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSong } from "@/actions/songs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";
import { formatDuration } from "@/lib/duration";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSong(id);
  if (!isActionSuccess(result)) notFound();
  const song = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title={song.title} description={song.artist ?? "Sin artista"}>
        <Button variant="outline" render={<Link href="/songs" />}>
          <ArrowLeft />
          Volver
        </Button>
      </PageHeader>

      <StatusBadge kind="song" status={song.status} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ficha técnica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Duración</p>
              <p className="font-medium">{formatDuration(song.durationSeconds)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tonalidad</p>
              <p className="font-medium">{song.keySignature ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tempo</p>
              <p className="font-medium">{song.tempo ? `${song.tempo} BPM` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Compás</p>
              <p className="font-medium">{song.timeSignature ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Voz principal</p>
              <p className="font-medium">{song.leadVocal ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Instrumentos</p>
              <p className="font-medium">{song.instruments ?? "—"}</p>
            </div>
            {song.tags.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Etiquetas</p>
                <p className="font-medium">{song.tags.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repertorios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {song.repertoireSongs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta canción no está en ningún repertorio.
              </p>
            ) : (
              song.repertoireSongs.map((rs) => (
                <Link
                  key={rs.id}
                  href={`/repertoires/${rs.repertoire.id}`}
                  className="block rounded-md border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  {rs.repertoire.name}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {(song.lyrics || song.technicalNotes) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {song.technicalNotes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notas técnicas</p>
                  <p className="whitespace-pre-wrap text-sm">{song.technicalNotes}</p>
                </div>
              )}
              {song.lyrics && (
                <div>
                  <p className="text-xs text-muted-foreground">Letra</p>
                  <p className="whitespace-pre-wrap text-sm">{song.lyrics}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}