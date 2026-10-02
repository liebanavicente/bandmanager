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
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { formatDuration } from "@/lib/duration";
import { ListPanel, ListRow } from "@/components/shared/list-panel";

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
    <ListPanel>
      {songs.map((song) => (
        <ListRow
          key={song.id}
          href={`/songs/${song.id}`}
          title={song.title}
          badges={<StatusBadge kind="song" status={song.status} />}
          meta={
            <>
              {song.artist ?? "Sin artista"} · {formatDuration(song.durationSeconds)}
              {song.keySignature ? ` · ${song.keySignature}` : ""}
            </>
          }
          trailing={song.tags.length > 0 ? <span>{song.tags.join(", ")}</span> : undefined}
          actions={
            <EntityActions entity="song" id={song.id} name={song.title} editHref={`/songs/${song.id}/edit`} />
          }
        />
      ))}
    </ListPanel>
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