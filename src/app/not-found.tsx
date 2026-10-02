import Link from "next/link";
import { RecordDisc } from "@/components/art/record-disc";
import { BmLogo } from "@/components/brand/bm-logo";
import { BmWordmark } from "@/components/brand/bm-wordmark";
import { StageGlow } from "@/components/glass/stage-glow";
import { Button } from "@/components/ui/button";

/** Página no encontrada: una pista que no está en el disco. */
export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden p-6 sm:p-12">
      <StageGlow />
      <RecordDisc
        center={<BmLogo size={110} title="" />}
        className="pointer-events-none absolute -bottom-40 -right-32 hidden size-[30rem] md:block"
      />
      <Link href="/" className="flex w-fit items-center gap-3" aria-label="BandManager">
        <BmLogo size={40} title="" />
        <BmWordmark title="" className="h-6 text-ink" />
      </Link>
      <div className="my-auto max-w-2xl space-y-5 py-16">
        <p className="eyebrow">Error 404 · Pista fantasma</p>
        <h1 className="poster-title text-7xl sm:text-9xl">
          <span className="text-stage-gradient">#</span>Esta pista no existe
        </h1>
        <div className="rule max-w-md" />
        <p className="max-w-md font-serif text-xl italic text-muted-foreground">
          La página que buscas no está en el disco. Puede que la hayan movido o que el enlace esté mal.
        </p>
        <Button nativeButton={false} render={<Link href="/" />} size="lg" className="h-11 px-5">
          Volver al panel
        </Button>
      </div>
    </main>
  );
}
