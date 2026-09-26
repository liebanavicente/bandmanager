"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kicker?: string;
  title: string;
  description?: string;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (form: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

/** Diálogo de formulario con cabecera de cartel y pie de acciones. */
export function FormDialog({
  open,
  onOpenChange,
  kicker,
  title,
  description,
  submitLabel,
  loading = false,
  onSubmit,
  children,
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-2rem)] overflow-y-auto border-t-2 border-t-stage-red shadow-poster sm:max-w-lg",
          className,
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(new FormData(e.currentTarget));
          }}
          className="grid gap-5"
        >
          <DialogHeader>
            {kicker && (
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{kicker}</p>
            )}
            <DialogTitle className="poster-title text-3xl">{title}</DialogTitle>
            {description && (
              <DialogDescription className="font-serif text-base italic">{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-4">{children}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
