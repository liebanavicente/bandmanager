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
        render={<Button variant="outline" className="h-10 gap-2 px-3.5 font-extrabold lg:hidden" />}
      >
        <Menu className="size-5" />
        Menú
      </SheetTrigger>
      <SheetContent side="left" className="w-full gap-0 bg-background p-0 text-foreground data-[side=left]:w-full data-[side=left]:sm:max-w-none">
        <SheetHeader className="border-b-2 border-ink px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <BmLogo size={32} />
            <span className="poster-title text-2xl">BandManager</span>
          </SheetTitle>
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
