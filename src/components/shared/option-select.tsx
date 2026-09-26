"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

type OptionSelectProps<T extends string> = {
  value: T | "";
  onValueChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

/**
 * Select con opciones declarativas: pasa `items` al Root para que el valor
 * seleccionado se muestre con su etiqueta (no con el código interno).
 */
export function OptionSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder = "Selecciona…",
  id,
  className,
  ...rest
}: OptionSelectProps<T>) {
  return (
    <Select
      items={options}
      value={value || null}
      onValueChange={(v) => {
        if (v != null) onValueChange(v as T);
      }}
    >
      <SelectTrigger id={id} className={cn("w-full", className)} aria-label={rest["aria-label"]}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
