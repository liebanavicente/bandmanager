"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { BandSummary } from "@/lib/workspace";
import { BmLogo } from "@/components/brand/bm-logo";
import { BmWordmark } from "@/components/brand/bm-wordmark";
import { visibleNavItems } from "@/components/layout/app-sidebar";
import { BandBadge } from "@/components/layout/band-badge";
import { NavList } from "@/components/layout/nav-list";
import { QuickCreate } from "@/components/layout/quick-create";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileNavProps = {
  role: UserRole;
  collaboratorAreas?: string[];
  band: BandSummary;
};

export function MobileNav({ role, collaboratorAreas, band }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const items = visibleNavItems(role, band.hasStore, collaboratorAreas);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" className="h-10 gap-2 px-3 font-extrabold lg:hidden" aria-label="Menú" />}
      >
        <Menu className="size-5" />
        <span className="hidden min-[400px]:inline">Menú</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-full gap-0 bg-background p-0 text-foreground data-[side=left]:w-full data-[side=left]:sm:max-w-none"
      >
        {/* Cabecera de marca: púa + logotipo y un cierre grande y fino */}
        <SheetHeader className="flex-row items-center justify-between gap-3 border-b border-hairline bg-white px-5 py-4 text-left shadow-[0_6px_20px_-14px_rgba(9,9,9,0.25)]">
          <SheetTitle className="flex min-w-0 items-center gap-3">
            <BmLogo size={42} title="" />
            <BmWordmark className="h-6 text-ink" />
          </SheetTitle>
          <SheetClose
            render={<Button variant="ghost" size="icon-lg" className="size-11 shrink-0 rounded-full bg-transparent hover:bg-ink/5" />}
          >
            <X className="size-7 stroke-[1.75]" />
            <span className="sr-only">Cerrar menú</span>
          </SheetClose>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 py-4">
          <BandBadge band={band} />
          <QuickCreate role={role} collaboratorAreas={collaboratorAreas} hasStore={band.hasStore} />
        </div>
        <div className="flex-1 overflow-y-auto pt-4">
          <NavList items={items} label="Navegación móvil" variant="mobile" onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
