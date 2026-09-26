"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { regenerateInviteCode } from "@/actions/band";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";

type InviteCardProps = {
  code: string;
  bandName: string;
  canRegenerate?: boolean;
  /** "stage": sobre fondo oscuro (asistente); "card": tarjeta normal. */
  tone?: "card" | "stage";
  className?: string;
};

function copy(text: string, label: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copiado`),
    () => toast.error("No se pudo copiar"),
  );
}

/** Código de la sala para que el resto de la banda se una. */
export function InviteCard({ code, bandName, canRegenerate = false, tone = "card", className }: InviteCardProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(code);
  const [origin, setOrigin] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const stage = tone === "stage";
  const link = `${origin}/join/${current}`;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOrigin(window.location.origin));
    return () => cancelAnimationFrame(raf);
  }, []);

  function share() {
    const text = `Únete a la sala de ${bandName} en BandManager con el código ${current}`;
    if (navigator.share) {
      void navigator.share({ title: `Sala de ${bandName}`, text, url: link }).catch(() => undefined);
    } else {
      copy(`${text}: ${link}`, "Mensaje");
    }
  }

  function regenerate() {
    startTransition(async () => {
      const result = await regenerateInviteCode();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setCurrent(result.data.inviteCode);
      setConfirm(false);
      toast.success("Nuevo código listo. El anterior ya no funciona.");
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-5",
        stage ? "bg-black/40 text-white ring-1 ring-white/10 backdrop-blur-sm" : "stage-surface grain text-white shadow-poster",
        className,
      )}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stage-amber">
            Código de la sala · {bandName}
          </p>
          <p className="mt-1 select-all font-display text-5xl leading-none tracking-[0.12em] sm:text-6xl" aria-label={`Código ${current.split("").join(" ")}`}>
            {current}
          </p>
          <p className="mt-2 max-w-md text-sm text-white/65">
            Quien entre con este código se une a la sala y ve y edita lo mismo que el resto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <Button size="sm" onClick={share}>
            <Share2 />
            Compartir
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white" onClick={() => copy(current, "Código")}>
            <Copy />
            Copiar código
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white" onClick={() => copy(link, "Enlace")} disabled={!origin}>
            <Link2 />
            Copiar enlace
          </Button>
          {canRegenerate && (
            <Button size="sm" variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setConfirm(true)}>
              <RefreshCw />
              Nuevo código
            </Button>
          )}
        </div>
      </div>
      {canRegenerate && (
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="¿Generar un código nuevo?"
          description="El código actual dejará de funcionar. Quien ya está en la sala sigue dentro."
          confirmLabel="Generar"
          loading={pending}
          onConfirm={regenerate}
        />
      )}
    </div>
  );
}
