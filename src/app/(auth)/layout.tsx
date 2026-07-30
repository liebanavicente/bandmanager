import { BmLogo } from "@/components/brand/bm-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel visual: fotografía musical muy oscura (solo escritorio) */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        {/* Imagen local generada en postinstall desde scripts/brand */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-hero.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-left opacity-60"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <BmLogo size={36} />
            <span className="text-sm font-semibold tracking-wide text-white">BandManager</span>
          </div>
          <div className="space-y-4">
            <p className="max-w-md text-2xl font-semibold leading-snug text-white">
              Tu banda, organizada.
            </p>
            <p className="max-w-md text-sm leading-relaxed text-white/70">
              Conciertos, ensayos, repertorio, setlists, tareas y merch.
              Todo el trabajo de la banda en un solo panel.
            </p>
          </div>
        </div>
      </div>

      {/* Zona de acceso: limpia y funcional */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <BmLogo size={40} />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">BandManager</h1>
            <p className="text-xs text-muted-foreground">Tu banda, organizada</p>
          </div>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
