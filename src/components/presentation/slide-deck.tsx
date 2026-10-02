"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LogIn,
  Sparkles,
  Pause,
  Play,
} from "lucide-react";
import { presentationSlides } from "@/lib/presentation-slides";
import { Button } from "@/components/ui/button";
import { BmLogo } from "@/components/brand/bm-logo";
import { BmWordmark } from "@/components/brand/bm-wordmark";
import { StageLights } from "@/components/art/stage-lights";
import { BackgroundVideo } from "@/components/art/background-video";
import { Vinyl } from "@/components/art/vinyl";
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
          <BmLogo size={36} title="" />
          <div className="leading-tight">
            <BmWordmark className="block h-5 text-ink" />
            <span className="block font-serif text-sm italic text-muted-foreground">
              Tu banda, en directo
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pausar presentación" : "Reproducir presentación"}
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button variant="ghost" size="sm" render={<Link href="/login" />} aria-label="Entrar">
            <LogIn />
            <span className="hidden sm:inline">Entrar</span>
          </Button>
          <Button size="sm" render={<Link href="/register" />}>
            <Sparkles />
            <span className="sm:hidden">Regístrate</span>
            <span className="hidden sm:inline">Registra tu banda</span>
          </Button>
        </div>
      </header>

      {/* Diapositiva */}
      <main className="relative flex flex-1 flex-col justify-center overflow-hidden px-4 py-10 sm:px-8">
        {/* Portada: humo con haces de luz, focos y vinilo girando */}
        {isIntro && (
          <div aria-hidden="true" className="stage-surface grain absolute inset-0">
            <BackgroundVideo
              name="/video/bg-humo"
              waitForIntro
              className="absolute inset-0 size-full opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <StageLights />
          </div>
        )}
        {/* Resto de pistas: vinilo en primer plano, tenue y solo en tema oscuro */}
        {!isIntro && (
          <div aria-hidden="true" className="absolute inset-0 hidden dark:block">
            {/* Volteado: el disco queda a la derecha, lejos del texto */}
            <BackgroundVideo name="/video/bg-vinilo" className="absolute inset-0 size-full -scale-x-100 opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
          </div>
        )}
        <Vinyl
          spin={isPlaying}
          className={cn(
            "pointer-events-none absolute -right-40 top-1/2 size-[30rem] -translate-y-1/2 transition-opacity duration-500 sm:size-[40rem]",
            isIntro ? "opacity-80" : "opacity-15 dark:opacity-0",
          )}
        />

        <div
          key={slide.id}
          className={cn(
            "relative mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500",
            isIntro && "text-white",
          )}
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-stage-gradient text-band-ink shadow-poster-red sm:size-14">
              <Icon className="size-6 sm:size-7" aria-hidden />
            </div>
            <div>
              <p className={cn("font-serif text-lg italic sm:text-xl", isIntro ? "text-white/75" : "text-muted-foreground")}>
                {slide.subtitle}
              </p>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.25em] text-band-text">
                Pista {number} / {String(total).padStart(2, "0")}
              </p>
            </div>
          </div>

          <h1 className="poster-title text-5xl sm:text-7xl lg:text-8xl">
            {slide.title}
          </h1>
          <div className="mt-5 h-1 w-20 rounded-full bg-stage-gradient" aria-hidden="true" />
          <p className={cn("mt-5 max-w-2xl text-base leading-relaxed sm:text-lg", isIntro ? "text-white/75" : "text-muted-foreground")}>
            {slide.description}
          </p>

          <ul className="mt-9 grid gap-3 sm:grid-cols-2">
            {slide.highlights.map((item, i) => (
              <li
                key={item}
                className={cn(
                  "stage-edge flex items-start gap-3 overflow-hidden rounded-lg bg-card/90 px-4 py-3 text-sm text-card-foreground ring-1 ring-foreground/10 backdrop-blur-sm transition-shadow hover:shadow-poster sm:text-base",
                  i === 0 && "sm:col-span-2",
                )}
              >
                <span className="mt-0.5 font-mono text-xs font-semibold text-band-text">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>

          {(isIntro || isLast) && (
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                render={<Link href="/register" />}
                className="h-12 px-6 font-display text-lg uppercase tracking-wider"
              >
                <Sparkles />
                Registra tu banda
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/register?join=1" />}
                className={cn("h-12", isIntro && "border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white")}
              >
                <KeyRound />
                Tengo un código
              </Button>
              {isLast && (
                <Button size="lg" variant="ghost" className="h-12" onClick={() => goTo(0)}>
                  Volver al inicio
                </Button>
              )}
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
                    ? "w-8 bg-stage-gradient"
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
