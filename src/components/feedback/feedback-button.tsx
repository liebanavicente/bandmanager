"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bug, HelpCircle, Lightbulb, MessageSquarePlus } from "lucide-react";
import type { FeedbackKind } from "@prisma/client";
import { toast } from "sonner";
import { createFeedback } from "@/actions/feedback";
import { FormDialog } from "@/components/shared/form-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const kinds: { value: FeedbackKind; label: string; icon: typeof Bug; placeholder: string }[] = [
  { value: "BUG", label: "Fallo", icon: Bug, placeholder: "¿Qué intentabas hacer y qué ha pasado?" },
  { value: "IDEA", label: "Idea", icon: Lightbulb, placeholder: "¿Qué echas en falta o qué cambiarías?" },
  {
    value: "CONFUSING",
    label: "Me ha confundido",
    icon: HelpCircle,
    placeholder: "¿Qué no se entendía o dónde te has perdido?",
  },
];

/** Botón "Feedback" de la cabecera: guarda el mensaje con la pantalla actual. */
export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("BUG");
  const [loading, setLoading] = useState(false);
  const current = kinds.find((k) => k.value === kind) ?? kinds[0];

  async function handleSubmit(form: FormData) {
    setLoading(true);
    const result = await createFeedback({
      kind,
      message: (form.get("message") as string) ?? "",
      path: pathname,
    });
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("¡Gracias! Lo leemos todo.");
    setOpen(false);
    setKind("BUG");
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="Enviar feedback">
        <MessageSquarePlus />
        <span className="hidden sm:inline">Feedback</span>
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        kicker="Piloto"
        title="Cuéntanos"
        description="Una frase basta: ya sabemos en qué pantalla estás."
        submitLabel="Enviar"
        loading={loading}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-2">
          <Label>¿Qué es?</Label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de feedback">
            {kinds.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                role="radio"
                aria-checked={kind === value}
                variant={kind === value ? "default" : "outline"}
                className="h-auto flex-col gap-1 whitespace-normal py-2 text-xs"
                onClick={() => setKind(value)}
              >
                <Icon />
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="feedback-message">Mensaje</Label>
          <Textarea
            id="feedback-message"
            name="message"
            rows={5}
            maxLength={4000}
            placeholder={current.placeholder}
            required
          />
        </div>
      </FormDialog>
    </>
  );
}
