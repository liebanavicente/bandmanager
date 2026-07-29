import { cn } from "@/lib/utils";

type TapeProps = {
  className?: string;
};

/** Cinta adhesiva decorativa. Posiciónala con clases absolutas desde el padre. */
export function Tape({ className }: TapeProps) {
  return <span aria-hidden="true" className={cn("tape", className)} />;
}
