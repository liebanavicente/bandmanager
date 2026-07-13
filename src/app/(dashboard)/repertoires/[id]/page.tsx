import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRepertoire } from "@/actions/repertoires";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";
import { formatDuration } from "@/lib/duration";

export default async function RepertoireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRepertoire(id);
  if (!isActionSuccess(result)) notFound();
  const repertoire = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title={repertoire.name} description={repertoire.description ?? undefined}>
        <Button variant="outline" render={<Link href="/repertoires" />}>
          <ArrowLeft />
          Volver
        </Button>
      </PageHeader>

      <div className="flex gap-2">
        {repertoire.isActive && <Badge>Repertorio activo</Badge>}
        {repertoire.isArchived && <Badge variant="secondary">Archivado</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canciones ({repertoire.songs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {repertoire.songs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin canciones aún.</p>
          ) : (
            repertoire.songs.map((item, index) => (
              <Link
                key={item.id}
                href={`/songs/${item.song.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-sm text-muted-foreground">{index + 1}</span>
                  <div>
                    <p className="font-medium">{item.song.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.song.artist ?? "—"} · {formatDuration(item.song.durationSeconds)}
                    </p>
                  </div>
                </div>
                <StatusBadge kind="song" status={item.song.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}