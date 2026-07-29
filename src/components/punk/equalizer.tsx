import { cn } from "@/lib/utils";

type EqualizerProps = {
  bars?: number;
  className?: string;
};

/** Barras de ecualizador animadas (CSS puro, pausables por reduced-motion). */
export function Equalizer({ bars = 5, className }: EqualizerProps) {
  return (
    <span aria-hidden="true" className={cn("flex h-4 items-end gap-[3px]", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-sm bg-current"
          style={{ height: "100%", animationDelay: `${i * 0.13}s` }}
        />
      ))}
    </span>
  );
}
