"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bm:intro-vista";
const FADE_MS = 700;

/**
 * Se ejecuta antes de pintar la portada: si ya se vio la intro o se pide
 * reducir movimiento, la oculta por CSS (`[data-intro="off"]`) sin parpadeo.
 */
export const introGateScript = `try{if(localStorage.getItem("${STORAGE_KEY}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="off"}catch(e){}`;

/** Vídeo de entrada de la portada: una vez por navegador, silenciable y saltable. */
export function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"playing" | "leaving" | "gone">("playing");
  const [muted, setMuted] = useState(true);

  const finish = useCallback(() => {
    setPhase((p) => (p === "playing" ? "leaving" : p));
    setTimeout(() => setPhase("gone"), FADE_MS);
  }, []);

  useEffect(() => {
    if (document.documentElement.dataset.intro === "off") return;
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Sin almacenamiento se volverá a ver; no es grave.
    }

    const video = videoRef.current;
    video?.play().catch(finish);
    // Si no arranca (red lenta, autoplay bloqueado), no hacemos esperar
    const guard = setTimeout(() => {
      if (!video || video.currentTime === 0) finish();
    }, 3000);

    // Mientras suena, las teclas no pasan las diapositivas de debajo
    function onKeyDown(e: KeyboardEvent) {
      e.stopImmediatePropagation();
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        finish();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(guard);
      window.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
    };
  }, [finish]);

  useEffect(() => {
    if (phase === "gone") document.documentElement.dataset.intro = "off";
  }, [phase]);

  if (phase === "gone") return null;

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  const control =
    "rounded-full border border-white/25 bg-black/40 px-4 py-2 font-extrabold text-[11px] uppercase text-white/90 backdrop-blur-sm transition hover:bg-black/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <div
      className={cn(
        "bm-intro fixed inset-0 z-[100] bg-black transition-opacity ease-out",
        phase === "leaving" && "pointer-events-none opacity-0",
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <video
        ref={videoRef}
        src="/video/bm-entrada.mp4"
        poster="/video/bm-entrada-poster.jpg"
        muted
        playsInline
        preload="none"
        onEnded={finish}
        onError={finish}
        aria-label="Vídeo de entrada de BandManager"
        className="size-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 p-4 sm:p-6">
        <button
          type="button"
          onClick={toggleSound}
          className={cn(control, "px-3")}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <button type="button" onClick={finish} className={control}>
          Saltar
        </button>
      </div>
    </div>
  );
}
