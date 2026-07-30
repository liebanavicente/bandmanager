"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { navItems, navSections } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { BAND_NAME } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { BmLogo } from "@/components/brand/bm-logo";
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
};

export function MobileNav({ role, collaboratorAreas }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // El drawer se cierra al navegar
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && role !== "ADMIN") return false;
    return hasPermission(role, item.area, collaboratorAreas);
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" />
        }
      >
        <Menu className="size-5" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <BmLogo size={30} />
            <span className="text-sm font-semibold tracking-wide">BandManager</span>
          </SheetTitle>
        </SheetHeader>
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15 text-[10px] font-bold text-sidebar-primary">
              {BAND_NAME.slice(0, 2).toUpperCase()}
            </span>
            <span className="truncate text-sm font-medium">{BAND_NAME}</span>
          </div>
        </div>
        <nav aria-label="Navegación móvil" className="flex flex-col gap-5 overflow-y-auto p-3">
          {navSections.map((section) => {
            const items = visibleItems.filter((item) => item.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                  {section}
                </p>
                {items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 inset-y-2 w-0.5 rounded-full bg-sidebar-primary"
                        />
                      )}
                      <Icon className="size-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
