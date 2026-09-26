import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ListMusic } from "lucide-react";
import { listSetlistChoices, listSetlists } from "@/actions/setlists";
import { NewSetlistButton } from "@/components/music/setlist-dialog";
import { EntityActions } from "@/components/shared/entity-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";

export default async function SetlistsPage() {
  const [result, choicesResult] = await Promise.all([listSetlists(), listSetlistChoices()]);
  const choices = isActionSuccess(choicesResult) ? choicesResult.data : { songs: [], events: [] };

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const setlists = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Setlists" description="Orden de temas para conciertos y ensayos.">
        <NewSetlistButton songs={choices.songs} events={choices.events} />
      </PageHeader>

      {setlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Sin setlists"
          description="Crea un setlist con «Nuevo setlist» y vincúlalo a un concierto."
        />
      ) : (
        <div className="grid gap-3">
          {setlists.map((setlist) => (
            <Card key={setlist.id} className="stage-edge relative transition-colors hover:bg-muted/30">
              <CardContent className="flex items-center gap-3 pt-6">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/setlists/${setlist.id}`}
                      className="font-medium after:absolute after:inset-0 after:content-['']"
                    >
                      {setlist.name}
                    </Link>
                    {setlist.event && (
                      <p className="text-sm text-muted-foreground">
                        {setlist.event.title} ·{" "}
                        {format(setlist.event.startAt, "d MMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {setlist._count.items} elementos
                  </p>
                </div>
                <EntityActions
                  entity="setlist"
                  id={setlist.id}
                  name={setlist.name}
                  editHref={`/setlists/${setlist.id}?edit=1`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}