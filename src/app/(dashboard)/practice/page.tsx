import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, Mic, Target, Upload } from "lucide-react";
import { getReviewQueue } from "@/actions/practice";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { isActionSuccess } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ensayar letras",
};

type Item = Extract<Awaited<ReturnType<typeof getReviewQueue>>, { success: true }>["data"]["items"][number];

function practiceHref(ids: string[]) {
  const [first, ...rest] = ids;
  return `/practice/${first}${rest.length ? `?queue=${rest.join(",")}` : ""}`;
}

function MasteryBar({ value }: { value: number | null }) {
  const tone = value === null ? "bg-muted-foreground/30" : value >= 85 ? "bg-emerald-500" : value >= 60 ? "bg-stage-amber" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", tone)} style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {value === null ? "—" : `${value}%`}
      </span>
    </div>
  );
}

function SongRow({ item }: { item: Item }) {
  return (
    <Link
      href={`/practice/${item.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.attempts === 0
            ? "Sin practicar"
            : `Practicada hace ${formatDistanceToNowStrict(item.lastPracticedAt!, { locale: es })}`}
          {item.weakCount > 0 && ` · ${item.weakCount} ${item.weakCount === 1 ? "verso flojo" : "versos flojos"}`}
          {item.gig && ` · suena en ${item.gig.title}`}
        </p>
      </div>
      <MasteryBar value={item.mastery} />
    </Link>
  );
}

export default async function PracticePage() {
  const result = await getReviewQueue();
  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }
  const { items, nextGig } = result.data;
  const due = items.filter((i) => i.due);
  const rest = items.filter((i) => !i.due);
  const gigItems = nextGig ? items.filter((i) => nextGig.songIds.includes(i.id)) : [];
  const gigMastery = gigItems.length
    ? Math.round(gigItems.reduce((sum, i) => sum + (i.mastery ?? 0), 0) / gigItems.length)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Ensayar letras" eyebrow="Música" description="Repasa lo que toca hoy y comprueba si te lo sabes.">
        <Button variant="outline" nativeButton={false} render={<Link href="/songs/import" />}>
          <Upload />
          Importar letras
        </Button>
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={Mic}
          title="Sin letras todavía"
          description="Importa las letras de tus canciones (Word, PDF o un ZIP) para empezar a practicar."
        />
      ) : (
        <>
          {nextGig && gigItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/40 bg-primary/5 p-5">
              <CalendarClock className="size-8 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  Próximo bolo · {formatDistanceToNowStrict(nextGig.startAt, { locale: es, addSuffix: true })}
                </p>
                <p className="font-display text-2xl uppercase">{nextGig.title}</p>
                <p className="text-sm text-muted-foreground">
                  {format(nextGig.startAt, "EEEE d 'de' MMMM", { locale: es })}
                  {nextGig.venue ? ` · ${nextGig.venue}` : ""} · {gigItems.length} letras · te las sabes al{" "}
                  <strong className="text-foreground">{gigMastery}%</strong>
                </p>
              </div>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={practiceHref([...gigItems].sort((a, b) => (a.mastery ?? -1) - (b.mastery ?? -1)).map((i) => i.id))} />}
              >
                <Target />
                Repasar el setlist
              </Button>
            </div>
          )}

          <section className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <h2 className="font-display text-2xl uppercase">Repasar hoy · {due.length}</h2>
              {due.length > 1 && (
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href={practiceHref(due.map((i) => i.id))} />}>
                  Repasar todas seguidas
                </Button>
              )}
            </div>
            {due.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Hoy no te toca repasar nada. 🤘 Puedes practicar cualquier canción de abajo.
              </p>
            ) : (
              due.map((item) => <SongRow key={item.id} item={item} />)
            )}
          </section>

          {rest.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-display text-2xl uppercase text-muted-foreground">Al día · {rest.length}</h2>
              {rest.map((item) => (
                <SongRow key={item.id} item={item} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
