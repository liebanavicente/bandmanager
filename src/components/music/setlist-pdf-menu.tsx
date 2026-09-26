"use client";

import { FileDown, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SetlistPdfMenuProps = {
  setlistId: string;
  /** "button": botón con texto (ficha); "icon": solo icono (filas del listado). */
  variant?: "button" | "icon";
  className?: string;
};

/** Exportar el setlist a PDF para imprimir: versión escenario o detallada. */
export function SetlistPdfMenu({ setlistId, variant = "button", className }: SetlistPdfMenuProps) {
  const href = (kind: "stage" | "full") => `/api/setlists/${setlistId}/pdf?variant=${kind}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "icon" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn("relative z-10 text-muted-foreground hover:text-foreground", className)}
              aria-label="Exportar a PDF"
            />
          ) : (
            <Button variant="outline" className={className} />
          )
        }
      >
        <Printer />
        {variant === "button" && "Imprimir PDF"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Exportar a PDF (A4)
        </DropdownMenuLabel>
        <DropdownMenuItem render={<a href={href("stage")} target="_blank" rel="noopener" />}>
          <FileDown />
          <span className="flex flex-col">
            <span className="font-medium">Escenario</span>
            <span className="text-xs text-muted-foreground">Letra enorme, para el suelo del escenario</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href={href("full")} target="_blank" rel="noopener" />}>
          <FileDown />
          <span className="flex flex-col">
            <span className="font-medium">Detallado</span>
            <span className="text-xs text-muted-foreground">Tono, tempo, compás, voz y notas</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
