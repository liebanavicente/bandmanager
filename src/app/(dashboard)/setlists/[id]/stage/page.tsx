import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { getSetlistStageView } from "@/actions/setlists";
import { Stamp } from "@/components/punk/stamp";
import { Button } from "@/components/ui/button";
import { isActionSuccess } from "@/lib/action-result";

/**
 * Vista escenario: siempre en modo backstage oscuro (tokens sidebar),
 * contraste máximo, tipografía grande y controles grandes para poca luz.
 */
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
    <div className="fixed inset-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3 sm:px-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-sidebar-primary">
            Vista escenario
          </p>
          <h1 className="font-display text-xl uppercase tracking-wide sm:text-2xl">
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
          size="icon-lg"
          className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
          render={<Link href={`/setlists/${stage.id}`} />}
        >
          <X />
          <span className="sr-only">Cerrar vista escenario</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          {stage.items.length === 0 ? (
            <p className="py-20 text-center font-display text-2xl uppercase tracking-wide text-muted-foreground">
              Setlist vacío
            </p>
          ) : (
            stage.items.map((item) => (
              <div
                key={item.position}
                className="flex items-baseline gap-4 rounded-lg border-2 border-sidebar-border bg-sidebar-accent/60 p-6 sm:gap-6 sm:p-8"
              >
                <span className="font-display text-4xl leading-none text-punk-acid tabular-nums sm:text-6xl">
                  {String(item.position).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  {item.type === "SONG" && item.song ? (
                    <>
                      <h2 className="font-display text-3xl leading-tight sm:text-5xl">
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
                        <p className="mt-3 font-punk text-xl text-punk-acid sm:text-2xl">
                          {item.comment}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="py-2">
                      <Stamp tone="paper" className="text-base sm:text-xl">
                        {item.type === "BREAK"
                          ? "Pausa"
                          : item.type === "ENCORE"
                            ? "Bis"
                            : (item.comment ?? "Nota")}
                      </Stamp>
                    </div>
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
