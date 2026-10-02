import { bandColorVars } from "@/lib/brand-color";

/**
 * Pone el acento de la banda en :root. Va en una etiqueta <style> (y no en
 * el `style` del layout) para que también lo hereden los diálogos, menús y
 * avisos, que se pintan en un portal fuera del contenedor de la sala.
 * Los valores salen de bandPalette, siempre hex normalizados.
 */
export function BandTheme({ color }: { color: string | null | undefined }) {
  const vars = Object.entries(bandColorVars(color))
    .map(([name, value]) => `${name}:${value}`)
    .join(";");
  return <style dangerouslySetInnerHTML={{ __html: `:root{${vars}}` }} />;
}
