"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Coffee,
  CornerDownRight,
  GripVertical,
  Guitar,
  ListPlus,
  Loader2,
  MessageSquare,
  Mic,
  Repeat2,
  Search,
  StickyNote,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SetlistItemType } from "@prisma/client";
import { toast } from "sonner";
import { createSetlist, updateSetlist } from "@/actions/setlists";
import { formatDuration, formatTotalDuration, parseDurationInput, sumDurations } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type BuilderSong = {
  id: string;
  title: string;
  artist: string | null;
  durationSeconds: number | null;
  tuning: string | null;
  keySignature: string | null;
  tempo: number | null;
};

export type BuilderRepertoire = { id: string; name: string; isActive: boolean; songIds: string[] };

export type BuilderEvent = { id: string; title: string; startAt: Date };

export type BuilderSetlist = {
  id: string;
  name: string;
  notes: string | null;
  eventId: string | null;
  repertoireId: string | null;
  items: {
    type: SetlistItemType;
    songId: string | null;
    comment: string | null;
    durationSeconds: number | null;
  }[];
};

type Track = {
  key: number;
  type: SetlistItemType;
  songId?: string;
  comment: string;
  /** Texto tal cual se teclea ("1:30"); se convierte al guardar. */
  duration: string;
  showComment?: boolean;
};

type Preset = { label: string; type: SetlistItemType; comment: string; duration: string; icon: LucideIcon };

const PRESETS: Preset[] = [
  { label: "Afinación", type: "BREAK", comment: "Afinación", duration: "1", icon: Guitar },
  { label: "Discurso", type: "NOTE", comment: "Hablar al público", duration: "1", icon: Mic },
  { label: "Presentación", type: "NOTE", comment: "Presentación de la banda", duration: "1:30", icon: Users },
  { label: "Descanso", type: "BREAK", comment: "Descanso", duration: "10", icon: Coffee },
  { label: "Bis", type: "ENCORE", comment: "", duration: "", icon: Repeat2 },
  { label: "Nota", type: "NOTE", comment: "", duration: "", icon: StickyNote },
];

const MARKER_ICON: Record<SetlistItemType, LucideIcon> = {
  SONG: Guitar,
  BREAK: Coffee,
  ENCORE: Repeat2,
  NOTE: StickyNote,
};

const MARKER_PLACEHOLDER: Record<SetlistItemType, string> = {
  SONG: "",
  BREAK: "Pausa (afinación, cambio de instrumento…)",
  ENCORE: "Bis",
  NOTE: "Qué pasa aquí (discurso, dedicatoria…)",
};

const ALL_SONGS = "all";
const NO_EVENT = "none";

let seed = 1;
function makeTrack(partial: Omit<Track, "key">): Track {
  return { key: seed++, ...partial };
}

function sameTuning(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

function SongMeta({ song, className }: { song: BuilderSong; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground", className)}>
      {song.tuning && (
        <span className="rounded bg-stage-amber/15 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-stage-amber">
          {song.tuning}
        </span>
      )}
      {song.keySignature && <span>{song.keySignature}</span>}
      {song.tempo && <span>{song.tempo} BPM</span>}
      <span className="tabular-nums">{formatDuration(song.durationSeconds)}</span>
    </span>
  );
}

type SetlistBuilderProps = {
  setlist?: BuilderSetlist;
  songs: BuilderSong[];
  repertoires: BuilderRepertoire[];
  events: BuilderEvent[];
  defaultEventId?: string;
};

/**
 * Montaje de setlist a pantalla completa: a la izquierda el repertorio (se
 * toca una canción y entra al final, en el orden en que se eligen), a la
 * derecha el show con afinaciones, pausas, discursos y bises.
 */
export function SetlistBuilder({ setlist, songs, repertoires, events, defaultEventId }: SetlistBuilderProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(setlist?.name ?? "");
  const [notes, setNotes] = useState(setlist?.notes ?? "");
  const [eventId, setEventId] = useState(setlist?.eventId ?? defaultEventId ?? NO_EVENT);
  const [sourceId, setSourceId] = useState(
    setlist?.repertoireId ?? repertoires.find((r) => r.isActive)?.id ?? repertoires[0]?.id ?? ALL_SONGS,
  );
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"source" | "show">(setlist ? "show" : "source");
  // Punto de inserción: después de esta pista (null = al final)
  const [cursor, setCursor] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [tracks, setTracks] = useState<Track[]>(() =>
    (setlist?.items ?? []).map((item) =>
      makeTrack({
        type: item.type,
        songId: item.songId ?? undefined,
        comment: item.comment ?? "",
        duration: item.durationSeconds ? formatDuration(item.durationSeconds).replace(/:00$/, "") : "",
      }),
    ),
  );

  const byId = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);

  const sourceSongs = useMemo(() => {
    if (sourceId === ALL_SONGS) return songs;
    const repertoire = repertoires.find((r) => r.id === sourceId);
    return (repertoire?.songIds ?? []).map((id) => byId.get(id)).filter((s): s is BuilderSong => Boolean(s));
  }, [sourceId, songs, repertoires, byId]);

  const q = query.trim().toLowerCase();
  const visibleSongs = q
    ? sourceSongs.filter((s) =>
        [s.title, s.artist, s.tuning, s.keySignature].some((field) => field?.toLowerCase().includes(q)),
      )
    : sourceSongs;

  // Número de cada canción en el show (pausas y bises no cuentan)
  const songNumbers = new Map<number, number>();
  const numberBySongId = new Map<string, number>();
  let counter = 0;
  for (const track of tracks) {
    if (track.type !== "SONG") continue;
    counter += 1;
    songNumbers.set(track.key, counter);
    if (track.songId && !numberBySongId.has(track.songId)) numberBySongId.set(track.songId, counter);
  }

  const totalSeconds = sumDurations(
    tracks.map((t) =>
      t.type === "SONG" ? (t.songId ? byId.get(t.songId)?.durationSeconds : null) : parseDurationInput(t.duration),
    ),
  );
  const pauseSeconds = sumDurations(tracks.filter((t) => t.type !== "SONG").map((t) => parseDurationInput(t.duration)));
  const missingDurations = tracks.filter(
    (t) => t.type === "SONG" && t.songId && !byId.get(t.songId)?.durationSeconds,
  ).length;

  const cursorIndex = cursor === null ? -1 : tracks.findIndex((t) => t.key === cursor);
  const cursorTrack = cursorIndex >= 0 ? tracks[cursorIndex] : null;

  /** Inserta en el punto de inserción (o al final) y avanza el cursor. */
  function insert(partial: Omit<Track, "key">) {
    const track = makeTrack(partial);
    setTracks((list) => {
      const at = cursor === null ? -1 : list.findIndex((t) => t.key === cursor);
      if (at < 0) return [...list, track];
      return [...list.slice(0, at + 1), track, ...list.slice(at + 1)];
    });
    if (cursor !== null) setCursor(track.key);
    return track;
  }

  function toggleSong(song: BuilderSong) {
    if (numberBySongId.has(song.id)) {
      setTracks((list) => list.filter((t) => t.songId !== song.id));
      return;
    }
    insert({ type: "SONG", songId: song.id, comment: "", duration: "" });
  }

  function addAllFromSource() {
    const missing = sourceSongs.filter((s) => !numberBySongId.has(s.id));
    if (missing.length === 0) {
      toast.info("Ya están todas las canciones de este repertorio.");
      return;
    }
    setTracks((list) => [
      ...list,
      ...missing.map((s) => makeTrack({ type: "SONG", songId: s.id, comment: "", duration: "" })),
    ]);
    setCursor(null);
    toast.success(`${missing.length} canciones añadidas en el orden del repertorio`);
  }

  function update(key: number, patch: Partial<Track>) {
    setTracks((list) => list.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }

  function remove(key: number) {
    setTracks((list) => list.filter((t) => t.key !== key));
    if (cursor === key) setCursor(null);
  }

  function moveTo(from: number, to: number) {
    if (from === to || to < 0 || to >= tracks.length) return;
    setTracks((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function insertTuningBreak(beforeKey: number, tuning: string) {
    setTracks((list) => {
      const at = list.findIndex((t) => t.key === beforeKey);
      const pause = makeTrack({ type: "BREAK", comment: `Afinar a ${tuning}`, duration: "1" });
      return [...list.slice(0, at), pause, ...list.slice(at)];
    });
  }

  async function save() {
    const finalName = name.trim() || events.find((e) => e.id === eventId)?.title || "";
    if (!finalName) {
      toast.error("Ponle nombre al setlist.");
      return;
    }
    const badDuration = tracks.find((t) => t.type !== "SONG" && t.duration.trim() && parseDurationInput(t.duration) === undefined);
    if (badDuration) {
      toast.error(`Duración no válida en «${badDuration.comment || "pausa"}». Usa minutos, por ejemplo 2 o 1:30.`);
      return;
    }

    setSaving(true);
    const payload = {
      name: finalName,
      notes,
      eventId: eventId === NO_EVENT ? (setlist ? "" : undefined) : eventId,
      repertoireId: sourceId === ALL_SONGS ? (setlist ? "" : undefined) : sourceId,
      items: tracks
        .filter((t) => t.type !== "SONG" || t.songId)
        .map((t) => ({
          type: t.type,
          songId: t.songId,
          comment: t.comment.trim(),
          durationSeconds: t.type === "SONG" ? undefined : parseDurationInput(t.duration),
        })),
    };
    const result = setlist ? await updateSetlist({ id: setlist.id, ...payload }) : await createSetlist(payload);
    setSaving(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(setlist ? "Setlist guardado" : "Setlist creado");
    router.push(`/setlists/${result.data.id}`);
  }

  const sourceOptions = [
    ...repertoires.map((r) => ({ value: r.id, label: `${r.name}${r.isActive ? " · activo" : ""} (${r.songIds.length})` })),
    { value: ALL_SONGS, label: `Todo el catálogo (${songs.length})` },
  ];
  const eventOptions = [
    { value: NO_EVENT, label: "Sin evento" },
    ...events.map((e) => ({ value: e.id, label: `${e.title} · ${format(e.startAt, "d MMM yyyy", { locale: es })}` })),
  ];
  const songCount = songNumbers.size;

  // Canciones que cambian de afinación respecto a la anterior (sin pausa para afinar entre medias)
  const tuningChanges = new Map<number, { from: string; to: string }>();
  {
    let previousTuning: string | null = null;
    let tunedSince = false;
    for (const track of tracks) {
      if (track.type !== "SONG") {
        if (/afina/i.test(track.comment)) tunedSince = true;
        continue;
      }
      const tuning = track.songId ? byId.get(track.songId)?.tuning : null;
      if (!tuning) continue;
      if (previousTuning && !sameTuning(previousTuning, tuning) && !tunedSince) {
        tuningChanges.set(track.key, { from: previousTuning, to: tuning });
      }
      previousTuning = tuning;
      tunedSince = false;
    }
  }

  return (
    <div className="space-y-5">
      {/* Cabecera: nombre, evento y notas */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="setlist-name" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {setlist ? "Editar setlist" : "Nuevo setlist"}
          </Label>
          <Input
            id="setlist-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={events.find((e) => e.id === eventId)?.title ?? "Setlist Sala Copérnico"}
            className="h-14 rounded-xl px-4 font-display text-2xl uppercase tracking-wide md:text-2xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Evento</Label>
          <OptionSelect value={eventId} onValueChange={setEventId} options={eventOptions} aria-label="Evento" className="h-14 rounded-xl" />
        </div>
      </div>

      {/* Selector móvil */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 lg:hidden" role="tablist">
        {(
          [
            { value: "source", label: "Repertorio" },
            { value: "show", label: `Show · ${songCount}` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mobileView === tab.value}
            onClick={() => setMobileView(tab.value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mobileView === tab.value ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Repertorio */}
        <section
          aria-label="Repertorio"
          className={cn(
            "flex flex-col rounded-xl border bg-card lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)]",
            mobileView !== "source" && "hidden lg:flex",
          )}
        >
          <div className="space-y-3 border-b p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Toca en el orden del show
              </h2>
              <Button type="button" variant="ghost" size="sm" onClick={addAllFromSource} disabled={sourceSongs.length === 0}>
                <ListPlus />
                Añadir todas
              </Button>
            </div>
            <OptionSelect value={sourceId} onValueChange={setSourceId} options={sourceOptions} aria-label="Repertorio de origen" />
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const first = visibleSongs.find((s) => !numberBySongId.has(s.id));
                    if (first) {
                      toggleSong(first);
                      setQuery("");
                    }
                  }
                }}
                placeholder="Buscar por título, afinación, tono…"
                aria-label="Buscar canción"
                className="pl-8"
              />
            </div>
          </div>

          <ul className="flex-1 space-y-1 overflow-y-auto p-2">
            {visibleSongs.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">
                {sourceSongs.length === 0 ? (
                  <>
                    Este repertorio está vacío.{" "}
                    <Link href="/songs/new" className="text-primary hover:underline">
                      Añade canciones
                    </Link>
                  </>
                ) : sourceId !== ALL_SONGS ? (
                  <>
                    No está en este repertorio.{" "}
                    <button type="button" onClick={() => setSourceId(ALL_SONGS)} className="text-primary hover:underline">
                      Buscar en todo el catálogo
                    </button>
                  </>
                ) : (
                  "Ninguna canción coincide."
                )}
              </li>
            ) : (
              visibleSongs.map((song) => {
                const number = numberBySongId.get(song.id);
                return (
                  <li key={song.id}>
                    <button
                      type="button"
                      onClick={() => toggleSong(song)}
                      aria-pressed={Boolean(number)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        number ? "bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm tabular-nums",
                          number ? "bg-primary text-primary-foreground" : "border border-dashed text-muted-foreground",
                        )}
                      >
                        {number ? String(number).padStart(2, "0") : "+"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{song.title}</span>
                        <SongMeta song={song} />
                      </span>
                      {number && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        {/* El show */}
        <section aria-label="Orden del show" className={cn("space-y-3", mobileView !== "show" && "hidden lg:block")}>
          <div className="flex flex-wrap items-end justify-between gap-2 rounded-xl border bg-card p-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Orden del show</p>
              <p className="font-display text-3xl tabular-nums">
                {songCount} {songCount === 1 ? "canción" : "canciones"} · {formatTotalDuration(totalSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">
                {pauseSeconds > 0 ? `Incluye ${formatTotalDuration(pauseSeconds)} de pausas. ` : ""}
                {missingDurations > 0 ? `${missingDurations} sin duración en la ficha.` : ""}
              </p>
            </div>
          </div>

          {/* Pausas rápidas */}
          <div className="rounded-xl border bg-card p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CornerDownRight className="size-3.5" />
              {cursorTrack ? (
                <>
                  Insertando después de{" "}
                  <strong className="font-medium text-foreground">
                    {cursorTrack.type === "SONG"
                      ? (byId.get(cursorTrack.songId ?? "")?.title ?? "canción")
                      : cursorTrack.comment || "la pausa"}
                  </strong>
                  <button type="button" onClick={() => setCursor(null)} className="ml-1 text-primary hover:underline">
                    ir al final
                  </button>
                </>
              ) : (
                "Se añade al final. Toca el número de una pista para insertar detrás de ella."
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insert({ type: preset.type, comment: preset.comment, duration: preset.duration })}
                >
                  <preset.icon />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {tracks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Toca las canciones del repertorio en el orden en que vais a tocarlas.
              <br />
              Después mete afinaciones, discursos o el bis donde toque.
            </div>
          ) : (
            <ol className="space-y-1.5">
              {tracks.map((track, index) => {
                const isSong = track.type === "SONG";
                const song = track.songId ? byId.get(track.songId) : undefined;
                const Icon = MARKER_ICON[track.type];

                const tuningChange = tuningChanges.get(track.key);

                return (
                  <li key={track.key} className="space-y-1.5">
                    {tuningChange && (
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stage-amber/40 bg-stage-amber/10 px-3 py-1.5 text-xs">
                        <Guitar className="size-3.5 text-stage-amber" />
                        <span>
                          Cambio de afinación: <strong>{tuningChange.from}</strong> → <strong>{tuningChange.to}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => insertTuningBreak(track.key, tuningChange.to)}
                          className="ml-auto font-medium text-primary hover:underline"
                        >
                          + Pausa para afinar
                        </button>
                      </div>
                    )}
                    <div
                      draggable
                      onDragStart={(e) => {
                        setDragging(index);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragging !== null) moveTo(dragging, index);
                        setDragging(null);
                      }}
                      onDragEnd={() => setDragging(null)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-2 ring-1 ring-foreground/10 transition-opacity",
                        isSong ? "bg-card" : "bg-muted/60",
                        dragging === index && "opacity-40",
                        cursor === track.key && "ring-2 ring-primary",
                      )}
                    >
                      <GripVertical className="hidden size-4 shrink-0 cursor-grab text-muted-foreground sm:block" aria-hidden />
                      <button
                        type="button"
                        onClick={() => setCursor(cursor === track.key ? null : track.key)}
                        title="Insertar lo siguiente detrás de esta pista"
                        className="flex w-8 shrink-0 justify-center font-display text-xl leading-none text-primary tabular-nums"
                      >
                        {isSong ? String(songNumbers.get(track.key)).padStart(2, "0") : <Icon className="size-4 text-muted-foreground" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {isSong ? (
                          <>
                            <span className="block truncate text-sm font-medium">
                              {song?.title ?? "Canción archivada o borrada"}
                            </span>
                            {song && <SongMeta song={song} />}
                            {(track.showComment || track.comment) && (
                              <Input
                                value={track.comment}
                                onChange={(e) => update(track.key, { comment: e.target.value })}
                                placeholder="Nota: empalma con la siguiente, capo 2…"
                                aria-label="Nota de la canción"
                                className="mt-1.5 h-7 text-xs"
                                autoFocus={track.showComment && !track.comment}
                              />
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              value={track.comment}
                              onChange={(e) => update(track.key, { comment: e.target.value })}
                              placeholder={MARKER_PLACEHOLDER[track.type]}
                              aria-label="Descripción"
                              className={cn(
                                "h-8 border-transparent bg-transparent font-serif text-base italic shadow-none md:text-base",
                                track.type === "ENCORE" && "font-display not-italic uppercase tracking-wide text-primary",
                              )}
                            />
                            {track.type !== "ENCORE" && (
                              <Input
                                value={track.duration}
                                onChange={(e) => update(track.key, { duration: e.target.value })}
                                placeholder="min"
                                inputMode="numeric"
                                aria-label="Duración en minutos"
                                title="Minutos (2) o minutos:segundos (1:30)"
                                className="h-8 w-16 shrink-0 text-center tabular-nums"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {isSong && !track.comment && !track.showComment && (
                        <Button type="button" variant="ghost" size="icon-xs" aria-label="Añadir nota" onClick={() => update(track.key, { showComment: true })}>
                          <MessageSquare />
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="icon-xs" aria-label="Subir" disabled={index === 0} onClick={() => moveTo(index, index - 1)}>
                        <ArrowUp />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-xs" aria-label="Bajar" disabled={index === tracks.length - 1} onClick={() => moveTo(index, index + 1)}>
                        <ArrowDown />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-xs" aria-label="Quitar" onClick={() => remove(track.key)}>
                        <X />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="space-y-2 pt-2">
            <Label htmlFor="setlist-notes">Notas generales</Label>
            <Textarea
              id="setlist-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Backline compartido, cambio de guitarras en el bis…"
            />
          </div>
        </section>
      </div>

      {/* Barra de guardado */}
      <div className="sticky bottom-0 z-30 -mx-4 border-t bg-background/90 backdrop-blur-sm sm:mx-0 sm:rounded-t-xl sm:border-x">
        <div className="flex items-center justify-end gap-3 px-4 py-3 sm:justify-between">
          <p className="hidden truncate text-sm text-muted-foreground sm:block">
            {songCount} canciones · {formatTotalDuration(totalSeconds)}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href={setlist ? `/setlists/${setlist.id}` : "/setlists"} />}>
              Cancelar
            </Button>
            <Button type="button" size="lg" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              {setlist ? "Guardar setlist" : "Crear setlist"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
