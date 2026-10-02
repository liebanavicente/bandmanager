"use client";

import { useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
import { BAND_COLOR_PRESETS, DEFAULT_BAND_COLOR, bandColorVars, normalizeHex } from "@/lib/brand-color";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type BandColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Color propuesto a partir del logo, si lo hay. */
  suggested?: string | null;
  /** Pinta toda la interfaz con el color mientras se elige. */
  livePreview?: boolean;
  className?: string;
};

function Swatch({
  color,
  label,
  selected,
  onSelect,
  children,
}: {
  color: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  const vars = bandColorVars(color);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={label}
      aria-label={label}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-full ring-1 ring-ink/15 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        selected && "ring-2 ring-ink ring-offset-2 ring-offset-paper",
      )}
      style={{ background: color, color: vars["--band-ink"] }}
    >
      {selected ? <Check className="size-4" aria-hidden="true" /> : children}
    </button>
  );
}

/**
 * Elige el acento de la banda: el color sacado del logo, una paleta curada
 * o cualquier hex. Con `livePreview`, la app entera cambia al momento (las
 * variables se ponen en <html> y se retiran al salir).
 */
export function BandColorPicker({ value, onChange, suggested, livePreview = true, className }: BandColorPickerProps) {
  const current = normalizeHex(value) ?? DEFAULT_BAND_COLOR;

  useEffect(() => {
    if (!livePreview) return;
    const root = document.documentElement;
    const vars = bandColorVars(current);
    for (const [name, v] of Object.entries(vars)) root.style.setProperty(name, v);
    return () => {
      for (const name of Object.keys(vars)) root.style.removeProperty(name);
    };
  }, [current, livePreview]);

  const suggestedHex = normalizeHex(suggested);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {suggestedHex && (
          <Swatch
            color={suggestedHex}
            label={`Color del logo (${suggestedHex})`}
            selected={current === suggestedHex}
            onSelect={() => onChange(suggestedHex)}
          >
            <Sparkles className="size-4" aria-hidden="true" />
          </Swatch>
        )}
        {suggestedHex && <span aria-hidden="true" className="mx-1 h-6 w-px bg-hairline" />}
        {BAND_COLOR_PRESETS.map((preset) => (
          <Swatch
            key={preset.value}
            color={preset.value}
            label={preset.name}
            selected={current === preset.value && current !== suggestedHex}
            onSelect={() => onChange(preset.value)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-ink/15" title="Cualquier color">
          <span className="sr-only">Elegir cualquier color</span>
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[conic-gradient(from_0deg,#E0301E,#FFB000,#D7FF00,#1FAF5A,#00B3A4,#2F5BFF,#7A3CFF,#FF3D8B,#E0301E)]"
          />
          <input
            type="color"
            value={current.toLowerCase()}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
        <Input
          aria-label="Color en hexadecimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(normalizeHex(value) ?? current)}
          maxLength={7}
          spellCheck={false}
          className="w-28 font-[family-name:var(--font-code)] uppercase"
        />
        <span className="eyebrow">Así se ve</span>
      </div>
    </div>
  );
}
