/**
 * Cristal esmerilado del panel. Los colores cambian con el tema
 * (--glass-* en globals.css) y funcionan sobre las luces de <StageGlow />.
 */
export const glassCard =
  "bg-(--glass-bg) ring-1 ring-(--glass-border) shadow-(--glass-shadow) backdrop-blur-xl backdrop-saturate-150";

/** Fila dentro de una tarjeta de cristal (evento, tarea, pedido…). */
export const glassRow =
  "bg-(--glass-row) ring-1 ring-(--glass-border) transition-colors hover:bg-(--glass-row-hover)";
