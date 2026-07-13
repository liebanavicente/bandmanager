import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ListMusic } from "lucide-react";
import { listSetlists } from "@/actions/setlists";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";

export default async function SetlistsPage() {
  const result = await listSetlists();

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const setlists = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Setlists"
        description="Orden de temas para conciertos y ensayos."
      />

      {setlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="Sin setlists"
          description="Crea un setlist vinculado a un evento o repertorio."
        />
      ) : (
        <div className="grid gap-4">
          {setlists.map((setlist) => (
            <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium">{setlist.name}</h3>
                    {setlist.event && (
                      <p className="text-sm text-muted-foreground">
                        {setlist.event.title} ·{" "}
                        {format(setlist.event.startAt, "d MMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {setlist._count.items} elementos
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