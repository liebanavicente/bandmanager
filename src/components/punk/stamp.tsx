import { cn } from "@/lib/utils";

type StampProps = {
  children: React.ReactNode;
  tone?: "red" | "paper" | "acid";
  animated?: boolean;
  className?: string;
};

const toneClasses: Record<NonNullable<StampProps["tone"]>, string> = {
  red: "text-punk-red",
  paper: "text-punk-paper",
  acid: "text-punk-acid",
};

/** Sello de tinta estampado. Solo para destacados, nunca en datos densos. */
export function Stamp({ children, tone = "red", animated = false, className }: StampProps) {
  return (
    <span
      className={cn(
        "stamp text-xs select-none",
        toneClasses[tone],
        animated && "animate-stamp-in",
        className,
      )}
    >
      {children}
    </span>
  );
}
