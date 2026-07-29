"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const VinylScene = dynamic(() => import("./vinyl-scene"), {
  ssr: false,
  loading: () => <VinylFallback />,
});

/** Representación estática: se muestra mientras carga la escena 3D
 *  y es la alternativa definitiva si WebGL no está disponible. */
function VinylFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        className="size-40 animate-float-slow"
        role="img"
        aria-label="Vinilo"
      >
        <circle cx="100" cy="100" r="96" fill="#0d0d0d" stroke="#2a2a2a" strokeWidth="2" />
        {[82, 68, 54].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#2a2a2a" strokeWidth="1" />
        ))}
        <circle cx="100" cy="100" r="32" fill="#E32620" />
        <circle cx="100" cy="100" r="5" fill="#F2EBDD" />
      </svg>
    </div>
  );
}

type VinylProps = {
  className?: string;
};

/** Vinilo 3D con carga diferida y fallback estático. Decorativo (oculto a lectores de pantalla),
 *  pero con eventos de puntero activos para el parallax sutil al cursor. */
export function Vinyl({ className }: VinylProps) {
  return (
    <div aria-hidden="true" className={cn(className)}>
      <VinylScene />
    </div>
  );
}
