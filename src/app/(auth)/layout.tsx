import { BmLogo } from "@/components/brand/bm-logo";
import { RecordDisc } from "@/components/art/record-disc";
import { Waveform } from "@/components/art/waveform";
import { StageGlow } from "@/components/glass/stage-glow";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      <StageGlow />
      {/* Cartel editorial: titular de gira, disco y onda (solo escritorio) */}
      <div className="relative hidden overflow-hidden lg:block">
        <RecordDisc
          label="Band Manager"
          className="pointer-events-none absolute -bottom-56 -right-44 size-[28rem] animate-spin-slow"
        />

        {/* Velo de papel tras el titular para que se lea sobre los focos */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,247,243,0.7),rgba(247,247,243,0.35)_70%,transparent)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <BmLogo size={40} />
            <span className="poster-title text-3xl">BandManager</span>
          </div>

          <div className="max-w-[34rem] space-y-6 pb-24">
            <p className="eyebrow">Gira 2026 · Todas las fechas</p>
            <h2 className="poster-title text-[5.5rem] xl:text-[7rem]">
              Tu banda,
              <br />
              <span className="text-outline [--stroke:var(--ink)]">en</span>{" "}
              <span className="text-stage-gradient">directo.</span>
            </h2>
            <div className="rule max-w-md" />
            <p className="max-w-md font-serif text-2xl italic leading-snug text-muted-foreground">
              Conciertos, ensayos, repertorio, setlists y merch. Todo el trabajo
              de la banda, detrás del escenario.
            </p>
            <Waveform seed="tu banda en directo" bars={64} progress={0.4} className="h-10 max-w-md text-ink" />
          </div>
        </div>
      </div>

      {/* Zona de acceso: limpia y funcional */}
      <div className="relative flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
          <BmLogo size={56} />
          <div>
            <h1 className="poster-title text-5xl">BandManager</h1>
            <p className="mt-1 font-serif text-lg italic text-muted-foreground">Tu banda, en directo</p>
          </div>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
