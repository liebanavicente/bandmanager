import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Coffee, Guitar, Monitor, Repeat2, StickyNote } from "lucide-react";
import { getSetlist } from "@/actions/setlists";
import { SetlistPdfMenu } from "@/components/music/setlist-pdf-menu";
import { EntityActions } from "@/components/shared/entity-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";
import { formatDuration, formatTotalDuration, setlistSeconds } from "@/lib/duration";

const markerIcons = { BREAK: Coffee, ENCORE: Repeat2, NOTE: StickyNote, SONG: Guitar } as const;
const markerLabels = { BREAK: "Pausa", ENCORE: "Bis", NOTE: "Nota", SONG: "" } as const;

export default async function SetlistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ id }, { edit }] = await Promise.all([params, searchParams]);
  // Enlaces antiguos "?edit=1" → editor a pantalla completa
  if (edit === "1") redirect(`/setlists/${id}/edit`);
  const result = await getSetlist(id);
  if (!isActionSuccess(result)) notFound();
  const setlist = result.data;

  const totalSeconds = setlistSeconds(setlist.items);
  let songNumber = 0;
  let previousTuning: string | null = null;

  return (
    <div className="space-y-6">
      <PageHeader title={setlist.name} description={setlist.notes ?? undefined}>
        <Button variant="ghost" nativeButton={false} render={<Link href="/setlists" />}>
          <ArrowLeft />
          Volver
        </Button>
        <EntityActions
          entity="setlist"
          id={setlist.id}
          name={setlist.name}
          editHref={`/setlists/${setlist.id}/edit`}
          variant="buttons"
          redirectAfterDelete
        />
        <SetlistPdfMenu setlistId={setlist.id} />
        <Button nativeButton={false} render={<Link href={`/setlists/${setlist.id}/stage`} />}>
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
            setlist.items.map((item) => {
              if (item.type !== "SONG" || !item.song) {
                const Icon = markerIcons[item.type];
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border border-dashed bg-muted/40 px-4 py-2"
                  >
                    <span className="flex w-8 justify-center">
                      <Icon className="size-4 text-muted-foreground" />
                    </span>
                    <p
                      className={
                        item.type === "ENCORE"
                          ? "flex-1 font-display uppercase tracking-wide text-primary"
                          : "flex-1 font-serif text-base italic text-muted-foreground"
                      }
                    >
                      {item.comment || markerLabels[item.type]}
                    </p>
                    {item.durationSeconds ? (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDuration(item.durationSeconds)}
                      </span>
                    ) : null}
                  </div>
                );
              }

              songNumber += 1;
              const tuningChanged =
                Boolean(item.song.tuning && previousTuning) &&
                item.song.tuning!.trim().toLowerCase() !== previousTuning!.trim().toLowerCase();
              if (item.song.tuning) previousTuning = item.song.tuning;

              return (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border px-4 py-3">
                  <span className="w-8 text-lg font-semibold text-primary tabular-nums">
                    {String(songNumber).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.song.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        item.song.artist,
                        item.song.keySignature,
                        item.song.tempo ? `${item.song.tempo} BPM` : null,
                        formatDuration(item.song.durationSeconds),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.comment && <p className="mt-1 text-xs text-muted-foreground">{item.comment}</p>}
                  </div>
                  {item.song.tuning && (
                    <span
                      className={
                        tuningChanged
                          ? "rounded bg-stage-amber px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-stage-ink"
                          : "rounded bg-stage-amber/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-stage-amber"
                      }
                      title={tuningChanged ? "Cambia la afinación" : "Afinación"}
                    >
                      {item.song.tuning}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}