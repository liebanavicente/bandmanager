"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type BackgroundVideoProps = {
  /** Ruta sin extensión: se sirven `${name}.mp4` y `${name}-poster.jpg`. */
  name: string;
  className?: string;
  /** Espera a que termine el vídeo de entrada para no competir por la red. */
  waitForIntro?: boolean;
};

/**
 * Vídeo decorativo en bucle. Solo se descarga y reproduce cuando se ve (un
 * contenedor oculto en móvil no gasta datos) y, con "reducir movimiento",
 * se queda en el póster.
 */
export function BackgroundVideo({ name, className, waitForIntro = false }: BackgroundVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let visible = false;
    const introDone = () => !waitForIntro || root.dataset.intro === "off";
    const sync = () => {
      if (visible && introDone()) video.play().catch(() => undefined);
      else video.pause();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(video);
    const mo = new MutationObserver(sync);
    if (waitForIntro) mo.observe(root, { attributes: true, attributeFilter: ["data-intro"] });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [waitForIntro]);

  return (
    <video
      ref={ref}
      src={`${name}.mp4`}
      poster={`${name}-poster.jpg`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className={cn("pointer-events-none object-cover", className)}
    />
  );
}
