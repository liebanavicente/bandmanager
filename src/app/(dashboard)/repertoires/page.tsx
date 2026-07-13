import Link from "next/link";
import { ListMusic } from "lucide-react";
import { listRepertoires } from "@/actions/repertoires";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";

export default async function RepertoiresPage() {
  const result = await listRepertoires();

  if (!isActionSuccess(result)) {
    return (
      <p className="text-sm text-destructive">{result.error}</p>
    );
  }

  const repertoires = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repertorios"
        description="Colecciones de canciones para giras y temporadas."
      />

      {repertoires.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Sin repertorios"
          description="Crea un repertorio activo para organizar el show."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {repertoires.map((rep) => (
            <Link key={rep.id} href={`/repertoires/${rep.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/30">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{rep.name}</h3>
                    {rep.isActive && <Badge>Activo</Badge>}
                    {rep.isArchived && (
                      <Badge variant="secondary">Archivado</Badge>
                    )}
                  </div>
                  {rep.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {rep.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {rep.songs.length} canciones · {rep._count.setlists} setlists
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}