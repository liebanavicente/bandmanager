import Link from "next/link";
import { Suspense } from "react";
import { Music2, Plus, Upload } from "lucide-react";
import type { SongStatus } from "@prisma/client";
import { listSongs } from "@/actions/songs";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityActions } from "@/components/shared/entity-actions";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { formatDuration } from "@/lib/duration";

const songStatusOptions = [
  { value: "PROPOSED", label: "Propuesta" },
  { value: "IN_PREPARATION", label: "En preparación" },
  { value: "REHEARSED", label: "Ensayada" },
  { value: "READY", label: "Lista" },
  { value: "ARCHIVED", label: "Archivada" },
];

async function SongsList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: SongStatus }>;
}) {
  const params = await searchParams;
  const result = await listSongs({ search: params.q, status: params.status });

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const songs = result.data.items;

  if (songs.length === 0) {
    return (
      <EmptyState
        icon={Music2}
        title="Sin canciones"
        description="Añade temas al catálogo de la banda."
        action={{ label: "Nueva canción", href: "/songs/new" }}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {songs.map((song) => (
        <Card key={song.id} className="stage-edge relative transition-colors hover:bg-muted/30">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Enlace extendido: toda la tarjeta abre la ficha */}
                  <Link
                    href={`/songs/${song.id}`}
                    className="font-medium after:absolute after:inset-0 after:content-['']"
                  >
                    {song.title}
                  </Link>
                  <StatusBadge kind="song" status={song.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {song.artist ?? "Sin artista"} · {formatDuration(song.durationSeconds)}
                  {song.keySignature ? ` · ${song.keySignature}` : ""}
                </p>
              </div>
              {song.tags.length > 0 && (
                <p className="text-xs text-muted-foreground">{song.tags.join(", ")}</p>
              )}
            </div>
            <EntityActions
              entity="song"
              id={song.id}
              name={song.title}
              editHref={`/songs/${song.id}/edit`}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: SongStatus }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Canciones"
        description="Catálogo musical con estados de ensayo."
      >
        <Button variant="outline" nativeButton={false} render={<Link href="/songs/import" />}>
          <Upload />
          Importar letras
        </Button>
        <Button nativeButton={false} render={<Link href="/songs/new" />}>
          <Plus />
          Nueva canción
        </Button>
      </PageHeader>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <SearchFilters
          searchPlaceholder="Buscar por título o artista…"
          statusOptions={songStatusOptions}
        />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <SongsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}