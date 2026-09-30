/**
 * Luces de escenario difuminadas detrás del contenido: lo que el cristal
 * de las tarjetas deja entrever. Estáticas (sin coste de animación).
 */
export function StageGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -right-24 top-40 size-[34rem] rounded-full bg-stage-red opacity-(--glow-opacity) blur-[120px]" />
      <div className="absolute -left-32 top-[38rem] size-[30rem] rounded-full bg-stage-amber opacity-(--glow-opacity) blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 size-[32rem] rounded-full bg-stage-violet opacity-(--glow-opacity) blur-[130px]" />
    </div>
  );
}
