import Link from "next/link";
import { ListMusic } from "lucide-react";
import { listRepertoireSongChoices, listRepertoires } from "@/actions/repertoires";
import { NewRepertoireButton, RepertoireActions } from "@/components/music/repertoire-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";

export default async function RepertoiresPage() {
  const [result, songsResult] = await Promise.all([listRepertoires(), listRepertoireSongChoices()]);
  const songs = isActionSuccess(songsResult) ? songsResult.data : [];

  if (!isActionSuccess(result)) {
    return (
      <p className="text-sm text-destructive">{result.error}</p>
    );
  }

  const repertoires = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Repertorios" description="Colecciones de canciones para giras y temporadas.">
        <NewRepertoireButton songs={songs} />
      </PageHeader>

      {repertoires.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Sin repertorios"
          description="Crea un repertorio con «Nuevo repertorio» para organizar el show."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repertoires.map((rep) => (
            <Card key={rep.id} className="stage-edge relative h-full transition-colors hover:bg-muted/30">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/repertoires/${rep.id}`}
                      className="font-display text-2xl uppercase leading-none after:absolute after:inset-0 after:content-['']"
                    >
                      {rep.name}
                    </Link>
                    {rep.isActive && <Badge>Activo</Badge>}
                    {rep.isArchived && <Badge variant="secondary">Archivado</Badge>}
                  </div>
                  <RepertoireActions
                    songs={songs}
                    repertoire={{
                      id: rep.id,
                      name: rep.name,
                      description: rep.description,
                      notes: rep.notes,
                      isActive: rep.isActive,
                      songIds: rep.songs.map((item) => item.songId),
                    }}
                  />
                </div>
                {rep.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{rep.description}</p>
                )}
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {rep.songs.length} canciones · {rep._count.setlists} setlists
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}