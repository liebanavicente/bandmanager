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
import { RecordDisc } from "@/components/art/record-disc";
import { StageGlow } from "@/components/glass/stage-glow";
import { glassCard } from "@/components/glass/glass";
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
    <div className="relative isolate flex min-h-screen flex-col text-foreground">
      <StageGlow />
      {/* Navbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-hairline bg-white/85 px-4 py-3 backdrop-blur-xl backdrop-saturate-150 sm:px-6">
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
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />} aria-label="Entrar">
            <LogIn />
            <span className="hidden sm:inline">Entrar</span>
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
            <Sparkles />
            <span className="sm:hidden">Regístrate</span>
            <span className="hidden sm:inline">Registra tu banda</span>
          </Button>
        </div>
      </header>

      {/* Diapositiva */}
      <main className="relative flex flex-1 flex-col justify-center overflow-hidden px-4 py-10 sm:px-8">
        {/* Portada: haces de luz del acento sobre el papel */}
        {isIntro && <StageLights />}
        {/* El disco de BandManager girando a la derecha, lejos del texto */}
        <RecordDisc
          center={<BmLogo size={120} title="" />}
          className={cn(
            "pointer-events-none absolute -right-40 top-1/2 hidden size-[30rem] -translate-y-1/2 transition-opacity duration-500 md:block lg:size-[38rem]",
            isPlaying && "animate-spin-slow",
            isIntro ? "opacity-100" : "opacity-25",
          )}
        />

        <div
          key={slide.id}
          className={cn(
            "relative mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500",
          )}
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-band text-band-ink ring-1 ring-ink sm:size-14">
              <Icon className="size-6 sm:size-7" aria-hidden />
            </div>
            <div>
              <p className="font-serif text-lg italic text-muted-foreground sm:text-xl">{slide.subtitle}</p>
              <p className="eyebrow mt-1">
                Pista {number} / {String(total).padStart(2, "0")}
              </p>
            </div>
          </div>

          {isIntro ? (
            <h1>
              <span className="sr-only">{slide.title}</span>
              <BmWordmark title="" className="h-12 max-w-full text-ink sm:h-16 lg:h-[4.5rem]" />
            </h1>
          ) : (
            <h1 className="poster-title text-5xl sm:text-7xl lg:text-8xl">{slide.title}</h1>
          )}
          <div className="rule mt-5 max-w-2xl" aria-hidden="true" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {slide.description}
          </p>

          <ul className={cn("mt-9 grid max-w-3xl overflow-hidden rounded-xl sm:grid-cols-2", glassCard)}>
            {slide.highlights.map((item, i) => (
              <li
                key={item}
                className={cn(
                  "flex items-start gap-3 border-b border-hairline px-4 py-3.5 text-sm font-medium transition-colors hover:bg-ink hover:text-white sm:text-base sm:even:border-r",
                  i === 0 && "sm:col-span-2",
                )}
              >
                <span className="mt-0.5 text-xs font-extrabold text-band-text">
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
                nativeButton={false}
                render={<Link href="/register" />}
                className="h-12 px-6 font-display text-lg uppercase"
              >
                <Sparkles />
                Registra tu banda
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/register?join=1" />}
                className="h-12"
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
      <footer className="border-t border-hairline bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6">
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
                    ? "w-8 bg-band ring-1 ring-ink"
                    : "w-3 bg-ink/20 hover:bg-ink/40",
                )}
              />
            ))}
            <span className="ml-2 text-xs font-extrabold text-muted-foreground tabular-nums">
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
