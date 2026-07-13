"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LogIn,
  Music4,
  Pause,
  Play,
} from "lucide-react";
import { presentationSlides } from "@/lib/presentation-slides";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SlideDeck() {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = presentationSlides.length;
  const slide = presentationSlides[current];
  const Icon = slide.icon;
  const isLast = current === total - 1;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.max(0, Math.min(total - 1, index)));
    },
    [total],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "Home") goTo(0);
      if (e.key === "End") goTo(total - 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, prev, goTo, total]);

  useEffect(() => {
    if (!isPlaying || isLast) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isPlaying, isLast, next]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <header className="flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Link href="/presentacion" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Music4 className="size-4" />
          </div>
          <span className="font-heading font-semibold">BandManager</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pausar presentación" : "Reproducir presentación"}
          >
            {isPlaying ? <Pause /> : <Play />}
            <span className="hidden sm:inline">{isPlaying ? "Pausar" : "Auto"}</span>
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/login" />}>
            <LogIn />
            Entrar
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8">
        <div
          key={slide.id}
          className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div
            className={cn(
              "mb-8 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br sm:size-20",
              slide.accent,
            )}
          >
            <Icon className="size-8 text-primary sm:size-10" aria-hidden />
          </div>

          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">
            {slide.subtitle}
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {slide.description}
          </p>

          <ul className="mt-8 space-y-3">
            {slide.highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border bg-card/60 px-4 py-3 text-sm sm:text-base"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="border-t bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2" role="tablist" aria-label="Diapositivas">
            {presentationSlides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Ir a diapositiva ${i + 1}: ${s.title}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === current
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
            <span className="ml-2 text-xs text-muted-foreground tabular-nums">
              {current + 1} / {total}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              disabled={current === 0}
              aria-label="Diapositiva anterior"
            >
              <ChevronLeft />
            </Button>
            {isLast ? (
              <Button size="lg" render={<Link href="/login" />}>
                <LogIn />
                Empezar ahora
              </Button>
            ) : (
              <Button onClick={next} size="lg">
                Siguiente
                <ChevronRight />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              disabled={isLast}
              aria-label="Diapositiva siguiente"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-muted-foreground">
          Usa las flechas del teclado ← → para navegar
        </p>
      </footer>
    </div>
  );
}