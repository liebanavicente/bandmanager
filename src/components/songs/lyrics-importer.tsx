"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronDown, FileText, Loader2, Music2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { importLyrics } from "@/actions/songs";
import { ACCEPTED_EXTENSIONS, extractDocuments } from "@/lib/lyrics/extract";
import { matchSong, parseLyricsDocument, titleFromFilename, type ParsedLyrics } from "@/lib/lyrics/parse";
import { cn } from "@/lib/utils";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ImportSong = {
  id: string;
  title: string;
  keySignature: string | null;
  tempo: number | null;
  hasLyrics: boolean;
};

type Row = {
  key: number;
  filename: string;
  parsed: ParsedLyrics;
  /** id de canción, "new" para crearla o "skip" para no importar. */
  target: string;
  newTitle: string;
  keySignature: string;
  open: boolean;
};

const NEW = "new";
const SKIP = "skip";

let seed = 1;

export function LyricsImporter({ songs }: { songs: ImportSong[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [failed, setFailed] = useState<{ filename: string; error: string }[]>([]);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const byId = new Map(songs.map((s) => [s.id, s]));

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    setReading(true);
    const docs = await extractDocuments(files);
    setReading(false);

    const titles = songs.map((s) => s.title);
    const taken = new Set(rows.map((r) => r.target));
    const next: Row[] = [];
    const errors: { filename: string; error: string }[] = [];
    for (const doc of docs) {
      if ("error" in doc) {
        errors.push(doc);
        continue;
      }
      const parsedSongs = parseLyricsDocument(doc.text, doc.filename, titles).filter((p) => p.lyrics.trim());
      if (parsedSongs.length === 0) {
        errors.push({ filename: doc.filename, error: "No se encontró texto (¿es un PDF escaneado?)." });
        continue;
      }
      for (const parsed of parsedSongs) {
        const match =
          matchSong(parsed.title, songs) ?? (parsedSongs.length === 1 ? matchSong(titleFromFilename(doc.filename), songs) : null);
        const target = match && !taken.has(match.id) ? match.id : NEW;
        if (target !== NEW) taken.add(target);
        next.push({
          key: seed++,
          filename: doc.filename,
          parsed,
          target,
          newTitle: parsed.title,
          keySignature: parsed.keySignature ?? "",
          open: false,
        });
      }
    }
    setRows((current) => [...current, ...next]);
    setFailed((current) => [...current, ...errors]);
    if (next.length) toast.success(`${next.length} ${next.length === 1 ? "letra leída" : "letras leídas"}. Revísalas antes de importar.`);
  }

  function update(key: number, patch: Partial<Row>) {
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const active = rows.filter((r) => r.target !== SKIP);
  const targetCounts = new Map<string, number>();
  for (const r of active) if (r.target !== NEW) targetCounts.set(r.target, (targetCounts.get(r.target) ?? 0) + 1);
  const hasConflicts = [...targetCounts.values()].some((n) => n > 1);
  const keyChanges = active.filter((r) => {
    const current = r.target !== NEW ? byId.get(r.target)?.keySignature : null;
    return r.keySignature.trim() && r.keySignature.trim() !== (current ?? "");
  }).length;

  async function submit() {
    if (hasConflicts) {
      toast.error("Hay dos letras apuntando a la misma canción.");
      return;
    }
    setSaving(true);
    const result = await importLyrics({
      items: active.map((r) => ({
        ...(r.target === NEW ? { newTitle: r.newTitle.trim() || r.parsed.title } : { songId: r.target }),
        lyrics: r.parsed.lyrics,
        chords: r.parsed.chords ?? undefined,
        keySignature: r.keySignature.trim() || undefined,
        tempo: r.parsed.tempo ?? undefined,
      })),
    });
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const { updated, created } = result.data;
    toast.success(
      [updated && `${updated} ${updated === 1 ? "canción actualizada" : "canciones actualizadas"}`, created && `${created} nuevas`]
        .filter(Boolean)
        .join(" · "),
    );
    router.push("/songs");
  }

  const targetOptions = [
    ...songs.map((s) => ({ value: s.id, label: s.title })),
    { value: NEW, label: "+ Crear canción nueva" },
    { value: SKIP, label: "No importar" },
  ];

  return (
    <div className="space-y-5">
      {/* Zona de subida */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        disabled={reading}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "hover:border-primary/60 hover:bg-muted/40",
        )}
      >
        {reading ? <Loader2 className="size-8 animate-spin text-primary" /> : <Upload className="size-8 text-primary" />}
        <span className="font-display text-xl uppercase tracking-wide">
          {reading ? "Leyendo archivos…" : "Arrastra aquí las letras"}
        </span>
        <span className="text-sm text-muted-foreground">
          Word (.docx o .doc), OpenDocument (.odt), PDF, .txt o un .zip con todas. Detectamos la canción, la tonalidad y los acordes.
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </button>

      {failed.length > 0 && (
        <div className="space-y-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">No se han podido leer:</p>
          {failed.map((f, i) => (
            <p key={i} className="text-muted-foreground">
              <span className="font-medium text-foreground">{f.filename}</span> — {f.error}
            </p>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <ol className="space-y-2">
          {rows.map((row) => {
            const song = row.target !== NEW && row.target !== SKIP ? byId.get(row.target) : undefined;
            const conflict = song && (targetCounts.get(song.id) ?? 0) > 1;
            const currentKey = song?.keySignature ?? null;
            const newKey = row.keySignature.trim();
            const keyChanged = Boolean(newKey) && newKey !== (currentKey ?? "");
            const skipped = row.target === SKIP;
            return (
              <li key={row.key} className={cn("rounded-xl border bg-card", skipped && "opacity-50")}>
                <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <FileText className="size-3.5 shrink-0" />
                      {row.filename}
                    </p>
                    <p className="truncate font-medium">{row.parsed.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.parsed.lineCount} versos
                      {row.parsed.chords ? " · con acordes" : ""}
                      {row.parsed.tempo ? ` · ${row.parsed.tempo} BPM` : ""}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <OptionSelect
                      value={row.target}
                      onValueChange={(target) => update(row.key, { target })}
                      options={targetOptions}
                      aria-label={`Canción para ${row.filename}`}
                    />
                    {row.target === NEW && (
                      <Input
                        value={row.newTitle}
                        onChange={(e) => update(row.key, { newTitle: e.target.value })}
                        aria-label="Título de la canción nueva"
                        placeholder="Título"
                        className="h-8"
                      />
                    )}
                    {conflict && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="size-3.5" /> Otra letra va a esta misma canción.
                      </p>
                    )}
                    {song?.hasLyrics && !conflict && (
                      <p className="text-xs text-muted-foreground">Ya tenía letra: se sustituirá.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Music2 className="size-3.5" />
                      {currentKey && keyChanged && <span className="line-through">{currentKey}</span>}
                      {currentKey && keyChanged && "→"}
                      <Input
                        value={row.keySignature}
                        onChange={(e) => update(row.key, { keySignature: e.target.value })}
                        placeholder={currentKey ?? "Tono"}
                        aria-label="Tonalidad"
                        title={row.parsed.keyRaw ? `En el documento: «${row.parsed.keyRaw}»` : "No venía en el documento"}
                        className={cn("h-8 w-16 text-center font-medium", keyChanged && "border-stage-amber text-stage-amber")}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Ver letra"
                      aria-expanded={row.open}
                      onClick={() => update(row.key, { open: !row.open })}
                    >
                      <ChevronDown className={cn("transition-transform", row.open && "rotate-180")} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar"
                      onClick={() => setRows((list) => list.filter((r) => r.key !== row.key))}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
                {row.open && (
                  <pre className="max-h-80 overflow-auto border-t bg-muted/30 p-4 font-sans text-sm whitespace-pre-wrap">
                    {row.parsed.lyrics}
                  </pre>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {rows.length > 0 && (
        <div className="sticky bottom-0 z-30 -mx-4 border-t bg-background/90 backdrop-blur-sm sm:mx-0 sm:rounded-t-xl sm:border-x">
          <div className="flex items-center justify-end gap-3 px-4 py-3 sm:justify-between">
            <p className="hidden text-sm text-muted-foreground sm:block">
              {active.length} {active.length === 1 ? "letra" : "letras"}
              {keyChanges ? ` · ${keyChanges} ${keyChanges === 1 ? "tonalidad cambia" : "tonalidades cambian"}` : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" nativeButton={false} render={<Link href="/songs" />}>
                Cancelar
              </Button>
              <Button type="button" size="lg" onClick={submit} disabled={saving || active.length === 0 || hasConflicts}>
                {saving ? <Loader2 className="animate-spin" /> : <Check />}
                Importar {active.length} {active.length === 1 ? "letra" : "letras"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
