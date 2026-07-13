import Link from "next/link";
import { Suspense } from "react";
import { Music2, Plus } from "lucide-react";
import type { SongStatus } from "@prisma/client";
import { listSongs } from "@/actions/songs";
import { EmptyState } from "@/components/shared/empty-state";
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
        <Link key={song.id} href={`/songs/${song.id}`}>
          <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{song.title}</h3>
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
            </CardContent>
          </Card>
        </Link>
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
        <Button render={<Link href="/songs/new" />}>
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