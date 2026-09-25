import { BmLogo } from "@/components/brand/bm-logo";
import { StageLights } from "@/components/art/stage-lights";
import { Vinyl } from "@/components/art/vinyl";
import { Waveform } from "@/components/art/waveform";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* Cartel: escenario con focos, vinilo y titular de gira (solo escritorio) */}
      <div className="stage-surface grain relative isolate hidden overflow-hidden lg:block">
        {/* Imagen local generada en postinstall desde scripts/brand, en duotono */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-hero.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-left opacity-25 mix-blend-luminosity"
        />
        <StageLights />
        <Vinyl
          spin
          label="BandManager"
          className="pointer-events-none absolute -bottom-40 -right-40 -z-10 size-[34rem] opacity-90"
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <BmLogo size={40} />
            <span className="poster-title text-2xl text-white">
              Band<span className="text-stage-gradient">Manager</span>
            </span>
          </div>

          <div className="space-y-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-stage-amber">
              Gira 2026 · Todas las fechas
            </p>
            <h2 className="poster-title text-[5.5rem] text-white xl:text-[7rem]">
              Tu banda,
              <br />
              <span className="text-outline [--stroke:#F4EEE4]">en</span>{" "}
              <span className="text-stage-gradient">directo.</span>
            </h2>
            <p className="max-w-md font-serif text-2xl italic leading-snug text-white/75">
              Conciertos, ensayos, repertorio, setlists y merch. Todo el trabajo
              de la banda, detrás del escenario.
            </p>
            <Waveform seed="tu banda en directo" bars={64} progress={0.4} className="h-10 max-w-md text-white" />
          </div>
        </div>
      </div>

      {/* Zona de acceso: limpia y funcional */}
      <div className="relative flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
          <BmLogo size={56} />
          <div>
            <h1 className="poster-title text-4xl">
              Band<span className="text-stage-gradient">Manager</span>
            </h1>
            <p className="mt-1 font-serif text-lg italic text-muted-foreground">Tu banda, en directo</p>
          </div>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
