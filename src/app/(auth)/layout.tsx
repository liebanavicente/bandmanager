import { Music4 } from "lucide-react";
import { Equalizer } from "@/components/punk/equalizer";
import { Stamp } from "@/components/punk/stamp";
import { Tape } from "@/components/punk/tape";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Cartel de pared: identidad backstage (solo escritorio) */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="halftone pointer-events-none absolute inset-0 text-sidebar-foreground opacity-[0.06]" aria-hidden="true" />
        <Tape className="absolute left-10 top-8 -rotate-6" />
        <Tape className="absolute bottom-24 right-14 rotate-3" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-10 -rotate-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-poster-sm">
            <Music4 className="size-5" />
          </div>
          <p className="font-display text-base uppercase tracking-widest">BandManager</p>
        </div>

        <div className="relative space-y-6">
          <Stamp tone="red" animated>Solo personal autorizado</Stamp>
          <h1 className="font-punk text-5xl leading-tight xl:text-6xl">
            La sala de ensayo,
            <br />
            <span className="text-sidebar-primary">bajo control.</span>
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Conciertos, ensayos, repertorio, setlists, tareas y merch.
            Todo el trabajo de la banda en un solo panel.
          </p>
          <Equalizer className="text-sidebar-primary" bars={7} />
        </div>

        <p className="relative text-[11px] uppercase tracking-widest text-muted-foreground">
          Cultura DIY · Profesionalidad · Directo
        </p>
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
