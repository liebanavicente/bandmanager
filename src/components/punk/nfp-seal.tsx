import { cn } from "@/lib/utils";

type NfpSealProps = {
  className?: string;
  /** Giro lento continuo, como un sello sobre el plato del tocadiscos. */
  spin?: boolean;
};

/**
 * Sello-pegatina de No Flag Patriots: disco de papel con la estampa en tinta,
 * visible sobre fondos oscuros. Imagen generada en postinstall desde
 * scripts/brand. Sustituye al antiguo vinilo 3D: misma presencia, cero WebGL.
 */
export function NfpSeal({ className, spin = false }: NfpSealProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/nfp-seal-sticker.png"
      alt="Sello de No Flag Patriots"
      className={cn("select-none", spin && "animate-spin-slow", className)}
      draggable={false}
    />
  );
}
