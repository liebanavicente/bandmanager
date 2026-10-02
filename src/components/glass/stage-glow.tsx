/**
 * Fondo de la sala: focos, vinilos, ondas y público sobre papel claro
 * (public/fondo-sala.webp). La imagen se guarda en escala de grises y se
 * tiñe aquí con el acento de la banda (mezcla "color": conserva la luz de
 * la foto y toma el tono del acento), así cada banda ve su propio color.
 * Un velo de papel la suaviza donde va el contenido. Fijo y estático.
 */
export function StageGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 isolate overflow-hidden bg-paper">
      <div className="absolute inset-0 bg-[url(/fondo-sala.webp)] bg-cover bg-[position:center_top] opacity-90" />
      {/* Tinte del acento: solo afecta a la foto de debajo (isolate) */}
      <div className="absolute inset-0 bg-band opacity-80 mix-blend-color" />
      {/* Velo: más denso en el centro, donde se lee, y libre en los bordes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(247,247,243,0.8),rgba(247,247,243,0.5)_60%,rgba(247,247,243,0.25))]" />
    </div>
  );
}
