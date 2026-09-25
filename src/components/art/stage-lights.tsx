import { cn } from "@/lib/utils";

type StageLightsProps = {
  className?: string;
};

/**
 * Haces de luz de escenario que cuelgan desde arriba y se balancean muy
 * despacio. Se colocan en absoluto dentro de una superficie `relative`
 * con `overflow-hidden`. Decorativo.
 */
export function StageLights({ className }: StageLightsProps) {
  const beams = [
    { left: "12%", color: "var(--stage-violet)", delay: "0s", width: "22%" },
    { left: "48%", color: "var(--stage-amber)", delay: "-3s", width: "18%" },
    { left: "78%", color: "var(--stage-red)", delay: "-6s", width: "26%" },
  ];

  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {beams.map((beam) => (
        <span
          key={beam.left}
          className="absolute -top-8 h-[140%] origin-top animate-beam opacity-40 mix-blend-screen blur-2xl"
          style={{
            left: beam.left,
            width: beam.width,
            animationDelay: beam.delay,
            background: `linear-gradient(180deg, color-mix(in oklab, ${beam.color} 85%, transparent) 0%, transparent 75%)`,
            clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
          }}
        />
      ))}
    </div>
  );
}
