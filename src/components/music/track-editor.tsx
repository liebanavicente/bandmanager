"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Coffee, Repeat2, X } from "lucide-react";
import type { SetlistItemType } from "@prisma/client";
import { formatDuration, formatTotalDuration, sumDurations } from "@/lib/duration";
import { cn } from "@/lib/utils";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";

export type SongChoice = { id: string; title: string; artist: string | null; durationSeconds: number | null };

export type Track = {
  key: number;
  type: SetlistItemType;
  songId?: string;
  comment?: string;
};

const markerLabels: Partial<Record<SetlistItemType, string>> = {
  BREAK: "Pausa",
  ENCORE: "Bis",
  NOTE: "Nota",
};

type TrackEditorProps = {
  songs: SongChoice[];
  tracks: Track[];
  onChange: (tracks: Track[]) => void;
  /** Permite pausas y bises (setlists). */
  allowMarkers?: boolean;
  /** Evita repetir una canción (repertorios). */
  uniqueSongs?: boolean;
};

let seed = 1;
export function newTrack(partial: Omit<Track, "key">): Track {
  return { key: seed++, ...partial };
}

/** Lista ordenable de pistas: añadir canciones, pausas y bises, subir, bajar y quitar. */
export function TrackEditor({ songs, tracks, onChange, allowMarkers = false, uniqueSongs = false }: TrackEditorProps) {
  const [picker, setPicker] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const byId = new Map(songs.map((s) => [s.id, s]));
  const used = new Set(tracks.map((t) => t.songId));
  const available = songs
    .filter((s) => !uniqueSongs || !used.has(s.id))
    .map((s) => ({ value: s.id, label: s.artist ? `${s.title} — ${s.artist}` : s.title }));
  const total = sumDurations(tracks.map((t) => (t.songId ? byId.get(t.songId)?.durationSeconds : null)));

  function move(index: number, delta: number) {
    const next = [...tracks];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  }

  function add(track: Omit<Track, "key">) {
    onChange([...tracks, newTrack(track)]);
    requestAnimationFrame(() => listRef.current?.lastElementChild?.scrollIntoView({ block: "nearest" }));
  }

  // Número de canción (las pausas y bises no cuentan)
  const songNumbers = tracks.reduce<number[]>((acc, t, i) => {
    const previous = i > 0 ? acc[i - 1] : 0;
    acc.push(t.type === "SONG" ? previous + 1 : previous);
    return acc;
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {tracks.filter((t) => t.type === "SONG").length} canciones
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {formatTotalDuration(total)}
        </span>
      </div>

      {tracks.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Aún no hay canciones. Elige la primera abajo.
        </p>
      ) : (
        <ol ref={listRef} className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {tracks.map((track, index) => {
            const song = track.songId ? byId.get(track.songId) : undefined;
            const isSong = track.type === "SONG";
            return (
              <li
                key={track.key}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ring-foreground/10",
                  isSong ? "bg-card" : "bg-muted/60",
                )}
              >
                <span className="w-7 text-center font-display text-lg leading-none text-primary">
                  {isSong ? String(songNumbers[index]).padStart(2, "0") : "—"}
                </span>
                <span className="min-w-0 flex-1">
                  {isSong ? (
                    <>
                      <span className="block truncate text-sm font-medium">{song?.title ?? "Canción borrada del catálogo"}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {song?.artist ?? "—"} · {formatDuration(song?.durationSeconds)}
                      </span>
                    </>
                  ) : (
                    <span className="block font-serif text-base italic text-muted-foreground">
                      {track.comment || markerLabels[track.type]}
                    </span>
                  )}
                </span>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Subir" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Bajar" disabled={index === tracks.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label="Quitar" onClick={() => onChange(tracks.filter((t) => t.key !== track.key))}>
                  <X />
                </Button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <OptionSelect
            value={picker}
            onValueChange={(songId) => {
              add({ type: "SONG", songId });
              setPicker("");
            }}
            options={available}
            placeholder={available.length ? "+ Añadir canción…" : "No quedan canciones por añadir"}
            aria-label="Añadir canción"
          />
        </div>
        {allowMarkers && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => add({ type: "BREAK" })}>
              <Coffee />
              Pausa
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => add({ type: "ENCORE" })}>
              <Repeat2 />
              Bis
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
