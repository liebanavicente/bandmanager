import { cn } from "@/lib/utils";
import { BackgroundVideo } from "@/components/art/background-video";

type RecordDiscProps = {
  /** Logo de la banda para la galleta central (data URL). */
  logoData?: string | null;
  /** Nombre de la banda: sus iniciales van en la galleta si no hay logo. */
  label?: string;
  className?: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(word))
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * El vinilo del panel en clave editorial: el vídeo del disco girando,
 * recortado en círculo y teñido con el acento de la banda, con filete de
 * tinta y la galleta central en papel con el logo. Decorativo.
 */
export function RecordDisc({ logoData, label, className }: RecordDiscProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate aspect-square overflow-hidden rounded-full bg-ink shadow-[0_24px_60px_-20px_rgba(9,9,9,0.45)] ring-2 ring-ink",
        className,
      )}
    >
      <BackgroundVideo name="/video/bg-vinilo" className="absolute inset-0 size-full scale-125 grayscale" />
      {/* Tinte del acento sobre los surcos */}
      <div className="absolute inset-0 bg-band mix-blend-color" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(9,9,9,0.55)_72%)]" />
      {/* Surcos dibujados encima para que el disco se lea aunque el vídeo no cargue */}
      <div className="vinyl-grooves absolute inset-0 rounded-full opacity-70" />
      {/* Galleta central */}
      <div className="absolute left-1/2 top-1/2 flex size-[38%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-paper ring-[6px] ring-band">
        {logoData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoData} alt="" className="size-[78%] object-contain" />
        ) : (
          <span className="poster-title text-[2.6rem] text-ink">{initials(label ?? "")}</span>
        )}
      </div>
    </div>
  );
}
