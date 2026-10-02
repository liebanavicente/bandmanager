/**
 * Fondo de la sala: papel hueso con dos focos muy suaves del acento de la
 * banda y un gran vinilo de surcos que asoma por la esquina (el eco del
 * bucle lima de Apuntes). Es lo que el cristal de las tarjetas deja
 * entrever. Fijo, estático y sin coste de animación.
 */
export function StageGlow() {
  const grooves = Array.from({ length: 22 }, (_, i) => 120 + i * 17);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute -right-40 -top-40 size-[44rem] rounded-full bg-band opacity-(--glow-opacity) blur-[140px]" />
      <div className="absolute -bottom-56 left-[18%] size-[36rem] rounded-full bg-band opacity-[calc(var(--glow-opacity)*0.6)] blur-[150px]" />
      <svg
        viewBox="0 0 1000 1000"
        className="absolute -bottom-[22rem] -right-[18rem] size-[58rem] text-band opacity-45 sm:-bottom-[26rem] sm:-right-[16rem] sm:size-[70rem]"
      >
        <circle cx="500" cy="500" r="490" fill="none" stroke="currentColor" strokeWidth="46" opacity="0.55" />
        {grooves.map((r) => (
          <circle key={r} cx="500" cy="500" r={r} fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
        ))}
        <circle cx="500" cy="500" r="96" fill="currentColor" opacity="0.4" />
      </svg>
      {/* Velo de papel para que el fondo nunca compita con el contenido */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,247,243,0.55),rgba(247,247,243,0.15)_40%,rgba(247,247,243,0.35))]" />
    </div>
  );
}
