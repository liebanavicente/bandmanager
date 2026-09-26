import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Monitor } from "lucide-react";
import { getSetlist, listSetlistChoices } from "@/actions/setlists";
import { SetlistActions } from "@/components/music/setlist-dialog";
import { SetlistPdfMenu } from "@/components/music/setlist-pdf-menu";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";
import { formatDuration, formatTotalDuration, sumDurations } from "@/lib/duration";

export default async function SetlistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ id }, { edit }] = await Promise.all([params, searchParams]);
  const [result, choicesResult] = await Promise.all([getSetlist(id), listSetlistChoices()]);
  if (!isActionSuccess(result)) notFound();
  const choices = isActionSuccess(choicesResult) ? choicesResult.data : { songs: [], events: [] };
  const setlist = result.data;

  const totalSeconds = sumDurations(
    setlist.items.map((item) => item.song?.durationSeconds),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={setlist.name} description={setlist.notes ?? undefined}>
        <Button variant="ghost" render={<Link href="/setlists" />}>
          <ArrowLeft />
          Volver
        </Button>
        <SetlistActions
          variant="buttons"
          defaultEditing={edit === "1"}
          songs={choices.songs}
          events={choices.events}
          setlist={{
            id: setlist.id,
            name: setlist.name,
            notes: setlist.notes,
            eventId: setlist.eventId,
            items: setlist.items.map((item) => ({
              type: item.type,
              songId: item.songId,
              comment: item.comment,
            })),
          }}
        />
        <SetlistPdfMenu setlistId={setlist.id} />
        <Button render={<Link href={`/setlists/${setlist.id}/stage`} />}>
          <Monitor />
          Vista escenario
        </Button>
      </PageHeader>

      {setlist.event && (
        <p className="text-sm text-muted-foreground">
          Evento:{" "}
          <Link href={`/events/${setlist.event.id}`} className="text-primary hover:underline">
            {setlist.event.title}
          </Link>
        </p>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Orden del show</CardTitle>
          <p className="text-sm text-muted-foreground">
            Duración total: {formatTotalDuration(totalSeconds)}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {setlist.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Setlist vacío.</p>
          ) : (
            setlist.items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border px-4 py-3"
              >
                <span className="w-8 text-lg font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  {item.type === "SONG" && item.song ? (
                    <>
                      <p className="font-medium">{item.song.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.song.artist ?? "—"} · {formatDuration(item.song.durationSeconds)}
                        {item.song.keySignature ? ` · ${item.song.keySignature}` : ""}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium italic text-muted-foreground">
                      {item.type === "BREAK"
                        ? "Pausa"
                        : item.type === "ENCORE"
                          ? "Bis"
                          : item.comment ?? "Nota"}
                    </p>
                  )}
                  {item.comment && item.type === "SONG" && (
                    <p className="mt-1 text-xs text-muted-foreground">{item.comment}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}