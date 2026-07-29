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
import { Stamp } from "@/components/punk/stamp";
import { Equalizer } from "@/components/punk/equalizer";
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
    <div className="flex min-h-screen flex-col bg-sidebar text-sidebar-foreground">
      {/* Cabecera de revista */}
      <header className="flex items-center justify-between border-b border-sidebar-border px-4 py-3 sm:px-6">
        <Link href="/presentacion" className="flex items-center gap-2.5">
          <div className="flex size-9 -rotate-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-poster-sm">
            <Music4 className="size-4" />
          </div>
          <div className="leading-tight">
            <span className="block font-display text-sm uppercase tracking-widest">
              BandManager
            </span>
            <span className="block font-punk text-[10px] text-muted-foreground">
              edición backstage · nº {number}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pausar presentación" : "Reproducir presentación"}
            className="text-muted-foreground hover:text-foreground"
          >
            {isPlaying ? <Pause /> : <Play />}
            <span className="hidden sm:inline">{isPlaying ? "Pausar" : "Auto"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/login" />}
            className="border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <LogIn />
            Entrar
          </Button>
        </div>
      </header>

      {/* Página-póster */}
      <main className="relative flex flex-1 flex-col justify-center overflow-hidden px-4 py-10 sm:px-8">
        {/* Fondo: logo-hero solo en la portada */}
        {isIntro && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-hero.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-left opacity-50"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/55 to-sidebar/20"
              aria-hidden="true"
            />
          </>
        )}
        <div className="halftone pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true" />
        {/* Marca de agua: sello No Flag Patriots (tinta clara) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/nfp-seal-light.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-16 size-72 rotate-12 opacity-[0.14] select-none sm:size-96"
          draggable={false}
        />

        <div
          key={slide.id}
          className="relative mx-auto w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="mb-8 flex items-end gap-5">
            <div className="flex size-16 -rotate-3 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-poster sm:size-20">
              <Icon className="size-8 sm:size-10" aria-hidden />
            </div>
            <div className="pb-1">
              <p className="font-punk text-sm text-muted-foreground sm:text-base">
                {slide.subtitle}
              </p>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                Pág. {number} / {String(total).padStart(2, "0")}
              </p>
            </div>
            {isIntro && (
              <div className="ml-auto hidden sm:block">
                <Stamp tone="acid" animated>
                  Solo personal autorizado
                </Stamp>
              </div>
            )}
          </div>

          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-6xl">
            {slide.title}
          </h1>
          <div className="mt-3 h-1 w-24 bg-primary" aria-hidden="true" />
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {slide.description}
          </p>

          <ul className="mt-9 grid gap-3 sm:grid-cols-2">
            {slide.highlights.map((item, i) => (
              <li
                key={item}
                className={cn(
                  "card-lift relative flex items-start gap-3 rounded-md border border-sidebar-border bg-background/70 px-4 py-3 text-sm backdrop-blur-xs sm:text-base",
                  i === 0 && "sm:col-span-2 sm:text-base",
                )}
              >
                <span className="mt-1 font-mono text-xs font-bold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>

          {isLast && (
            <div className="mt-10">
              <Button size="lg" render={<Link href="/login" />} className="shadow-poster">
                <LogIn />
                Empezar ahora
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Pie de revista */}
      <footer className="border-t border-sidebar-border px-4 py-4 sm:px-6">
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
                  "h-2 rounded-full transition-all",
                  i === current
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
            <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
              {current + 1} / {total}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Equalizer className="hidden text-primary sm:block" bars={5} />
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
        <p className="mx-auto mt-3 max-w-4xl text-center font-punk text-[11px] text-muted-foreground">
          Usa las flechas del teclado ← → para pasar página
        </p>
      </footer>
    </div>
  );
}
