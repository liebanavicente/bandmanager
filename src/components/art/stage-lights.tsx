import { cn } from "@/lib/utils";

type StageLightsProps = {
  className?: string;
};

/**
 * Haces de luz de escenario que cuelgan desde arriba y se balancean muy
 * despacio, en el acento de la banda y suaves sobre el papel claro. Se
 * colocan en absoluto dentro de una superficie `relative` con
 * `overflow-hidden`. Decorativo.
 */
export function StageLights({ className }: StageLightsProps) {
  const beams = [
    { left: "8%", delay: "0s", width: "20%", opacity: 0.22 },
    { left: "44%", delay: "-3s", width: "16%", opacity: 0.14 },
    { left: "74%", delay: "-6s", width: "24%", opacity: 0.2 },
  ];

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {beams.map((beam) => (
        <span
          key={beam.left}
          className="absolute -top-8 h-[140%] origin-top animate-beam blur-2xl"
          style={{
            left: beam.left,
            width: beam.width,
            opacity: beam.opacity,
            animationDelay: beam.delay,
            background: "linear-gradient(180deg, var(--band) 0%, transparent 70%)",
            clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
          }}
        />
      ))}
    </div>
  );
}
