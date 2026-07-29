import Image from "next/image";
import { Music4 } from "lucide-react";
import { Equalizer } from "@/components/punk/equalizer";
import { Stamp } from "@/components/punk/stamp";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Cartel a sangre: logo-hero de la banda (solo escritorio) */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <Image
          src="/brand/logo-hero.webp"
          alt="Cartel de BandManager: amplificador, cassette y púa sobre un muro rasgado"
          fill
          priority
          sizes="50vw"
          className="object-cover object-left opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/40 to-transparent" aria-hidden="true" />

        <div className="relative flex h-full flex-col justify-end p-12">
          <div className="space-y-5">
            <Stamp tone="acid" animated>Solo personal autorizado</Stamp>
            <p className="max-w-md font-punk text-2xl leading-snug text-sidebar-foreground">
              La sala de ensayo, bajo control.
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Conciertos, ensayos, repertorio, setlists, tareas y merch.
              Todo el trabajo de la banda en un solo panel.
            </p>
            <Equalizer className="text-sidebar-primary" bars={7} />
          </div>
        </div>
      </div>

      {/* Zona de acceso: limpia y funcional */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex size-10 -rotate-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-poster-sm">
            <Music4 className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-lg uppercase tracking-widest">BandManager</h1>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Tu banda, organizada</p>
          </div>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
