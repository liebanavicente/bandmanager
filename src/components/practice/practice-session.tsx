"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Target,
  ThumbsDown,
  ThumbsUp,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { recordPractice } from "@/actions/practice";
import {
  checkLine,
  initials,
  lineKey,
  pickGaps,
  practiceLines,
  sameWord,
  words,
  type LineCheck,
  type PracticeLine,
  type PracticeMode,
} from "@/lib/lyrics/practice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PracticeSong = {
  id: string;
  title: string;
  keySignature: string | null;
  lyrics: string;
  progress: {
    mastery: number;
    attempts: number;
    weakLines: Record<string, { miss: number; hit: number }>;
  } | null;
};

type Props = {
  song: PracticeSong;
  /** Canciones que vienen después (repaso encadenado). */
  queue: string[];
};

type LineOutcome = { line: PracticeLine; score: number; check?: LineCheck };

const MODES: { value: PracticeMode; title: string; text: string; icon: LucideIcon }[] = [
  { value: "read", title: "Leer", text: "Verso a verso, para empaparte. No puntúa.", icon: BookOpen },
  { value: "gaps", title: "Huecos", text: "Escribe las palabras que faltan.", icon: EyeOff },
  { value: "initials", title: "Iniciales", text: "Solo la primera letra de cada palabra. Recítalo y compruébalo.", icon: Eye },
  { value: "memory", title: "De memoria", text: "Con el verso anterior como pista, escribe el siguiente.", icon: Type },
];

const GAP_LEVELS = [
  { value: 0.25, label: "25 %" },
  { value: 0.5, label: "50 %" },
  { value: 0.75, label: "75 %" },
  { value: 1, label: "Todo" },
];

const noAutocorrect = { autoComplete: "off", autoCorrect: "off", autoCapitalize: "none", spellCheck: false } as const;

function scoreTone(score: number) {
  return score >= 0.9 ? "text-emerald-500" : score >= 0.6 ? "text-stage-amber" : "text-destructive";
}

export function PracticeSession({ song, queue }: Props) {
  const router = useRouter();
  const allLines = useMemo(() => practiceLines(song.lyrics), [song.lyrics]);
  const weak = song.progress?.weakLines ?? {};
  const weakKeys = new Set(Object.entries(weak).filter(([, w]) => w.miss > w.hit).map(([k]) => k));
  const weakLines = allLines.filter((l) => weakKeys.has(lineKey(l.text)));

  const [mode, setMode] = useState<PracticeMode | null>(null);
  const [gapRatio, setGapRatio] = useState(0.5);
  const [lines, setLines] = useState<PracticeLine[]>(allLines);
  const [position, setPosition] = useState(0);
  const [outcomes, setOutcomes] = useState<LineOutcome[]>([]);
  const [seed, setSeed] = useState(1);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ score: number; mastery: number; previousMastery: number | null; nextReviewAt: Date | null } | null>(null);

  // Estado del verso actual
  const [typed, setTyped] = useState("");
  const [gapInputs, setGapInputs] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [check, setCheck] = useState<LineCheck | null>(null);
  const [gapScore, setGapScore] = useState<number | null>(null);

  const firstInput = useRef<HTMLInputElement>(null);
  const primaryButton = useRef<HTMLButtonElement>(null);
  // Copia síncrona de los resultados (el estado llega tarde al terminar)
  const outcomesRef = useRef<LineOutcome[]>([]);
  const line = lines[position];
  const previous = position > 0 ? lines[position - 1] : null;
  const gaps = useMemo(
    () => (line && mode === "gaps" ? pickGaps(line.text, gapRatio, seed * 1000 + line.index) : []),
    [line, mode, gapRatio, seed],
  );
  const answered = check !== null || gapScore !== null;
  const typing = (mode === "memory" || mode === "gaps") && !answered;

  // Enter siempre hace lo siguiente: escribir, comprobar o pasar de verso
  useEffect(() => {
    if (!mode || finished) return;
    if (typing) firstInput.current?.focus();
    else primaryButton.current?.focus();
  }, [mode, position, typing, revealed, finished]);

  function start(selected: PracticeMode, onlyWeak = false) {
    setMode(selected);
    setLines(onlyWeak && weakLines.length ? weakLines : allLines);
    restartState();
  }

  function restartState() {
    setPosition(0);
    setOutcomes([]);
    outcomesRef.current = [];
    setFinished(false);
    setSaved(null);
    setSeed((s) => s + 1);
    resetLine();
  }

  function resetLine() {
    setTyped("");
    setGapInputs({});
    setRevealed(false);
    setCheck(null);
    setGapScore(null);
  }

  function record(score: number, lineCheck?: LineCheck) {
    outcomesRef.current = [...outcomesRef.current.slice(0, position), { line, score, check: lineCheck }];
    setOutcomes(outcomesRef.current);
  }

  function checkMemory() {
    const result = checkLine(line.text, typed);
    setCheck(result);
    record(result.score, result);
  }

  function checkGaps() {
    const list = words(line.text);
    const hits = gaps.filter((i) => sameWord(list[i], gapInputs[i] ?? "")).length;
    const score = gaps.length ? hits / gaps.length : 1;
    setGapScore(score);
    record(score);
  }

  function gradeInitials(knewIt: boolean) {
    record(knewIt ? 1 : 0);
    advance();
  }

  function advance() {
    if (position + 1 >= lines.length) {
      void finish();
      return;
    }
    setPosition((p) => p + 1);
    resetLine();
  }

  async function finish() {
    setFinished(true);
    if (mode === "read") return;
    const final = outcomesRef.current;
    if (final.length === 0) return;
    setSaving(true);
    const result = await recordPractice({
      songId: song.id,
      mode,
      gapRatio: mode === "gaps" ? gapRatio : undefined,
      lines: final.map((o) => ({ key: lineKey(o.line.text), score: o.score })),
    });
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSaved(result.data);
    router.refresh();
  }

  const nextSongHref = queue.length ? `/practice/${queue[0]}${queue.length > 1 ? `?queue=${queue.slice(1).join(",")}` : ""}` : null;

  // ——— Elegir modo ———
  if (!mode) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Header song={song} />
        {allLines.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            Esta canción aún no tiene letra.{" "}
            <Link href="/songs/import" className="text-primary hover:underline">
              Importar letras
            </Link>
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODES.map((m) => (
                <div key={m.value} className="flex flex-col rounded-xl border bg-card p-4">
                  <p className="flex items-center gap-2 font-display text-xl uppercase tracking-wide">
                    <m.icon className="size-5 text-primary" />
                    {m.title}
                  </p>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{m.text}</p>
                  {m.value === "gaps" && (
                    <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Cuánto ocultar">
                      {GAP_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          role="radio"
                          aria-checked={gapRatio === level.value}
                          onClick={() => setGapRatio(level.value)}
                          className={cn(
                            "flex-1 rounded-md border px-2 py-1 text-xs",
                            gapRatio === level.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <Button className="mt-3" onClick={() => start(m.value)}>
                    Empezar
                  </Button>
                </div>
              ))}
            </div>
            {weakLines.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stage-amber/40 bg-stage-amber/10 p-4">
                <p className="flex items-center gap-2 text-sm">
                  <Target className="size-4 text-stage-amber" />
                  Tienes {weakLines.length} {weakLines.length === 1 ? "verso que se te atraganta" : "versos que se te atragantan"}.
                </p>
                <Button variant="outline" onClick={() => start("memory", true)}>
                  Practicar solo esos
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ——— Resumen ———
  if (finished) {
    const scored = outcomes.filter(Boolean);
    const failed = scored.filter((o) => o.score < 0.9);
    const average = scored.length ? scored.reduce((s, o) => s + o.score, 0) / scored.length : 0;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Header song={song} />
        {mode === "read" ? (
          <p className="rounded-xl border bg-card p-6 text-center font-display text-2xl uppercase">Leída entera</p>
        ) : (
          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Resultado</p>
            <p className={cn("font-display text-7xl tabular-nums", scoreTone(average))}>{Math.round(average * 100)}%</p>
            {saving ? (
              <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Guardando…
              </p>
            ) : saved ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Dominio {saved.previousMastery !== null ? `${saved.previousMastery}% → ` : ""}
                <strong className="text-foreground">{saved.mastery}%</strong>
                {saved.nextReviewAt &&
                  ` · próximo repaso ${format(new Date(saved.nextReviewAt), "EEEE d 'de' MMMM", { locale: es })}`}
              </p>
            ) : null}
          </div>
        )}

        {failed.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Para repasar ({failed.length})
            </p>
            {failed.map((o) => (
              <div key={o.line.index} className="rounded-lg border bg-card px-4 py-2">
                {o.line.section && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{o.line.section}</p>}
                <p className="font-medium">{o.line.text}</p>
                {o.check && o.check.extra.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Pusiste: <span className="line-through">{o.check.extra.join(" ")}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {failed.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setLines(failed.map((o) => o.line));
                restartState();
              }}
            >
              <Target />
              Repetir los fallos
            </Button>
          )}
          <Button variant="outline" onClick={() => restartState()}>
            <RotateCcw />
            Otra vez
          </Button>
          <Button variant="ghost" onClick={() => setMode(null)}>
            Cambiar de modo
          </Button>
          <div className="flex-1" />
          {nextSongHref ? (
            <Button nativeButton={false} render={<Link href={nextSongHref} />}>
              Siguiente canción
              <ArrowRight />
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link href="/practice" />}>
              Volver al repaso
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ——— Verso a verso ———
  const list = words(line.text);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Header song={song} />

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(position / lines.length) * 100}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {position + 1}/{lines.length}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Salir" onClick={() => setMode(null)}>
          <X />
        </Button>
      </div>

      <div className="min-h-72 rounded-2xl border bg-card p-6 sm:p-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
          {line.section ?? (line.startsStanza ? "Nueva estrofa" : " ")}
        </p>
        <p className="mt-4 min-h-6 font-serif text-lg italic text-muted-foreground">
          {previous && !line.startsStanza ? previous.text : line.startsStanza && position > 0 ? "…" : ""}
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (answered) advance();
            else if (mode === "memory") checkMemory();
            else if (mode === "gaps") checkGaps();
            else if (mode === "read") advance();
            else setRevealed(true);
          }}
        >
          {mode === "read" && <p className="font-display text-3xl leading-tight sm:text-4xl">{line.text}</p>}

          {mode === "initials" && (
            <>
              <p className="font-display text-3xl tracking-wide sm:text-4xl">{initials(line.text)}</p>
              {revealed && <p className="text-xl font-medium">{line.text}</p>}
            </>
          )}

          {mode === "gaps" && (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-3 text-2xl leading-relaxed sm:text-3xl">
              {list.map((word, i) => {
                const gapIndex = gaps.indexOf(i);
                if (gapIndex < 0) return <span key={i}>{word}</span>;
                const value = gapInputs[i] ?? "";
                const ok = gapScore !== null ? sameWord(word, value) : null;
                return (
                  <span key={i} className="inline-flex flex-col">
                    <input
                      ref={gapIndex === 0 ? firstInput : undefined}
                      value={value}
                      onChange={(e) => setGapInputs((g) => ({ ...g, [i]: e.target.value }))}
                      readOnly={gapScore !== null}
                      aria-label={`Palabra ${i + 1}`}
                      style={{ width: `${Math.max(3, word.length + 1)}ch` }}
                      className={cn(
                        "border-b-2 bg-transparent text-center outline-none",
                        ok === null ? "border-primary/60 focus:border-primary" : ok ? "border-emerald-500 text-emerald-500" : "border-destructive text-destructive line-through",
                      )}
                      {...noAutocorrect}
                    />
                    {ok === false && <span className="text-center text-base text-emerald-500">{word}</span>}
                  </span>
                );
              })}
            </p>
          )}

          {mode === "memory" && (
            <>
              <Input
                ref={firstInput}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                readOnly={check !== null}
                placeholder="Escribe el verso…"
                aria-label="Verso"
                className="h-14 rounded-xl px-4 text-xl md:text-xl"
                {...noAutocorrect}
              />
              {check && (
                <p className="flex flex-wrap gap-x-2 text-2xl">
                  {check.expected.map((w, i) => (
                    <span key={i} className={w.ok ? "text-emerald-500" : "text-destructive underline decoration-2"}>
                      {w.word}
                    </span>
                  ))}
                </p>
              )}
            </>
          )}

          {(check || gapScore !== null) && (
            <p className={cn("font-mono text-sm", scoreTone(check?.score ?? gapScore ?? 0))}>
              {Math.round((check?.score ?? gapScore ?? 0) * 100)}%
              {check && check.extra.length > 0 && <span className="text-muted-foreground"> · sobra: {check.extra.join(" ")}</span>}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            {mode === "initials" && revealed ? (
              <>
                <Button type="button" variant="outline" size="lg" onClick={() => gradeInitials(false)}>
                  <ThumbsDown />
                  Fallé
                </Button>
                <Button ref={primaryButton} type="button" size="lg" onClick={() => gradeInitials(true)}>
                  <ThumbsUp />
                  Me la sabía
                </Button>
              </>
            ) : answered || mode === "read" ? (
              <Button ref={primaryButton} type="submit" size="lg">
                {position + 1 >= lines.length ? "Terminar" : "Siguiente"}
                <ArrowRight />
              </Button>
            ) : (
              <Button ref={primaryButton} type="submit" size="lg">
                {mode === "initials" ? (
                  <>
                    <Eye /> Ver verso
                  </>
                ) : (
                  <>
                    <Check /> Comprobar
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
      <p className="text-center text-xs text-muted-foreground">Enter para comprobar y pasar al siguiente verso.</p>
    </div>
  );
}

function Header({ song }: { song: PracticeSong }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Ensayar letra</p>
        <h1 className="truncate font-display text-4xl uppercase sm:text-5xl">{song.title}</h1>
      </div>
      <div className="shrink-0 text-right">
        {song.keySignature && <p className="text-sm text-muted-foreground">Tono {song.keySignature}</p>}
        {song.progress && (
          <p className="font-mono text-xs text-muted-foreground">
            Dominio <span className="text-foreground">{song.progress.mastery}%</span>
          </p>
        )}
      </div>
    </div>
  );
}
