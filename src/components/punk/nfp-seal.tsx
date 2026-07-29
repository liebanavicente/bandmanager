import { cn } from "@/lib/utils";

type NfpSealProps = {
  className?: string;
  /** Giro lento continuo, como un sello sobre el plato del tocadiscos. */
  spin?: boolean;
};

/**
 * Sello circular de No Flag Patriots (imagen de marca generada en postinstall).
 * Sustituye al antiguo vinilo 3D: misma presencia, cero coste de WebGL.
 */
export function NfpSeal({ className, spin = false }: NfpSealProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/nfp-seal-paper.png"
      alt="Sello de No Flag Patriots"
      className={cn("select-none", spin && "animate-spin-slow", className)}
      draggable={false}
    />
  );
}
