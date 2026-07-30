"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LogIn,
  Pause,
  Play,
} from "lucide-react";
import { presentationSlides } from "@/lib/presentation-slides";
import { Button } from "@/components/ui/button";
import { BmLogo } from "@/components/brand/bm-logo";
import { cn } from "@/lib/utils";

export function SlideDeck() {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = presentationSlides.length;
  const slide = presentationSlides[current];
  const Icon = slide.icon;
  const isIntro = current === 0;
  const isLast = current === total - 1;
  const number = String(current + 1).padStart(2, "0");

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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Link href="/presentacion" className="flex items-center gap-2.5">
          <BmLogo size={32} />
          <div className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide">
              BandManager
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Tu banda, organizada
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pausar presentación" : "Reproducir presentación"}
            className="text-muted-foreground hover:text-foreground"
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/login" />}
            className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <LogIn />
            Entrar
          </Button>
        </div>
      </header>

      {/* Diapositiva */}
      <main className="relative flex flex-1 flex-col justify-center overflow-hidden px-4 py-10 sm:px-8">
        {/* Fondo fotográfico muy oscuro solo en la portada */}
        {isIntro && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-hero.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-left opacity-40"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40"
              aria-hidden="true"
            />
          </>
        )}

        <div
          key={slide.id}
          className="relative mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-foreground/10 sm:size-14">
              <Icon className="size-6 sm:size-7" aria-hidden />
            </div>
            <div>
              <p className="text-sm text-muted-foreground sm:text-base">
                {slide.subtitle}
              </p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
                Pág. {number} / {String(total).padStart(2, "0")}
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {slide.title}
          </h1>
          <div className="mt-4 h-0.5 w-16 bg-primary" aria-hidden="true" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {slide.description}
          </p>

          <ul className="mt-9 grid gap-3 sm:grid-cols-2">
            {slide.highlights.map((item, i) => (
              <li
                key={item}
                className={cn(
                  "flex items-start gap-3 rounded-lg bg-card px-4 py-3 text-sm ring-1 ring-foreground/10 transition-shadow hover:shadow-poster sm:text-base",
                  i === 0 && "sm:col-span-2",
                )}
              >
                <span className="mt-0.5 font-mono text-xs font-semibold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>

          {isLast && (
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/login" />}>
                <LogIn />
                Empezar ahora
              </Button>
              <Button size="lg" variant="outline" onClick={() => goTo(0)}>
                Volver al inicio
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Pie con navegación */}
      <footer className="border-t px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  "h-1.5 rounded-full transition-all",
                  i === current
                    ? "w-8 bg-primary"
                    : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
            <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
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
            {!isLast && (
              <Button onClick={next}>
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
      </footer>
    </div>
  );
}
