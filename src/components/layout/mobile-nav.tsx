"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import type { UserRole } from "@prisma/client";
import type { BandSummary } from "@/lib/workspace";
import { BmLogo } from "@/components/brand/bm-logo";
import { visibleNavItems } from "@/components/layout/app-sidebar";
import { BandBadge } from "@/components/layout/band-badge";
import { NavList } from "@/components/layout/nav-list";
import { QuickCreate } from "@/components/layout/quick-create";
import { Button } from "@/components/ui/button";
import {
  Sheet,
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
        render={<Button variant="ghost" size="icon" className="lg:hidden" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 gap-0 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <BmLogo size={32} />
            <span className="poster-title text-xl text-sidebar-foreground">
              Band<span className="text-stage-gradient">Manager</span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 border-b border-sidebar-border px-4 py-4">
          <BandBadge band={band} />
          <QuickCreate role={role} collaboratorAreas={collaboratorAreas} hasStore={band.hasStore} />
        </div>
        <div className="flex-1 overflow-y-auto pt-4">
          <NavList items={items} label="Navegación móvil" onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
