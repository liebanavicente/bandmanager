import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ListMusic, Plus } from "lucide-react";
import { listSetlists } from "@/actions/setlists";
import { SetlistPdfMenu } from "@/components/music/setlist-pdf-menu";
import { EntityActions } from "@/components/shared/entity-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { isActionSuccess } from "@/lib/action-result";
import { ListPanel, ListRow } from "@/components/shared/list-panel";

export default async function SetlistsPage() {
  const result = await listSetlists();

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const setlists = result.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Setlists" description="Orden de temas para conciertos y ensayos.">
        <Button nativeButton={false} render={<Link href="/setlists/new" />}>
          <Plus />
          Nuevo setlist
        </Button>
      </PageHeader>

      {setlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Sin setlists"
          description="Crea un setlist con «Nuevo setlist» y vincúlalo a un concierto."
        />
      ) : (
        <ListPanel>
          {setlists.map((setlist) => (
            <ListRow
              key={setlist.id}
              href={`/setlists/${setlist.id}`}
              title={setlist.name}
              meta={
                setlist.event
                  ? `${setlist.event.title} · ${format(setlist.event.startAt, "d MMM yyyy", { locale: es })}`
                  : undefined
              }
              trailing={<span className="text-[11px] font-extrabold uppercase">{setlist._count.items} elementos</span>}
              actions={
                <>
                  <SetlistPdfMenu setlistId={setlist.id} variant="icon" />
                  <EntityActions
                    entity="setlist"
                    id={setlist.id}
                    name={setlist.name}
                    editHref={`/setlists/${setlist.id}/edit`}
                  />
                </>
              }
            />
          ))}
        </ListPanel>
      )}
    </div>
  );
}