import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { getSetlistStageView } from "@/actions/setlists";
import { Button } from "@/components/ui/button";
import { isActionSuccess } from "@/lib/action-result";

export default async function SetlistStagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSetlistStageView(id);
  if (!isActionSuccess(result)) notFound();

  const stage = result.data;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div>
          <p className="text-sm text-muted-foreground">Vista escenario</p>
          <h1 className="font-heading text-xl font-semibold sm:text-2xl">
            {stage.name}
          </h1>
          {stage.totalDuration && (
            <p className="text-xs text-muted-foreground">
              Duración total: {stage.totalDuration}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          render={<Link href={`/setlists/${stage.id}`} />}
        >
          <X />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {stage.items.length === 0 ? (
            <p className="text-center text-2xl text-muted-foreground">
              Setlist vacío
            </p>
          ) : (
            stage.items.map((item) => (
              <div
                key={item.position}
                className="flex items-baseline gap-4 rounded-2xl border-2 border-primary/20 bg-card p-6 sm:gap-6 sm:p-8"
              >
                <span className="font-heading text-4xl font-bold text-primary sm:text-5xl">
                  {item.position}
                </span>
                <div className="min-w-0 flex-1">
                  {item.type === "SONG" && item.song ? (
                    <>
                      <h2 className="font-heading text-3xl font-bold leading-tight sm:text-5xl">
                        {item.song.title}
                      </h2>
                      <p className="mt-2 text-lg text-muted-foreground sm:text-2xl">
                        {[
                          item.song.artist,
                          item.song.duration,
                          item.song.keySignature,
                          item.song.tempo ? `${item.song.tempo} BPM` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {item.comment && (
                        <p className="mt-3 text-xl text-primary sm:text-2xl">
                          {item.comment}
                        </p>
                      )}
                    </>
                  ) : (
                    <h2 className="font-heading text-2xl font-semibold italic text-muted-foreground sm:text-4xl">
                      {item.type === "BREAK"
                        ? "— PAUSA —"
                        : item.type === "ENCORE"
                          ? "— BIS —"
                          : item.comment ?? "— NOTA —"}
                    </h2>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}