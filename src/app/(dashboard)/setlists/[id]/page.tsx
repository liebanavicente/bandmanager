import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Monitor } from "lucide-react";
import { getSetlist } from "@/actions/setlists";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";
import { formatDuration, formatTotalDuration, sumDurations } from "@/lib/duration";

export default async function SetlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSetlist(id);
  if (!isActionSuccess(result)) notFound();
  const setlist = result.data;

  const totalSeconds = sumDurations(
    setlist.items.map((item) => item.song?.durationSeconds),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={setlist.name} description={setlist.notes ?? undefined}>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/setlists" />}>
            <ArrowLeft />
            Volver
          </Button>
          <Button render={<Link href={`/setlists/${setlist.id}/stage`} />}>
            <Monitor />
            Vista escenario
          </Button>
        </div>
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