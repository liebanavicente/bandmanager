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
import { Equalizer } from "@/components/punk/equalizer";
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
            <BmLogo size={32} />
            <span className="poster-title text-xl text-sidebar-foreground">
              Band<span className="text-stage-gradient">Manager</span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-sidebar-border stage-surface px-3 py-2.5">
            <span className="size-2 shrink-0 animate-live rounded-full bg-stage-red" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-white/55">
                En gira
              </span>
              <span className="block truncate font-serif text-lg italic leading-tight text-white">
                {BAND_NAME}
              </span>
            </span>
          </div>
        </div>
        <nav aria-label="Navegación móvil" className="flex flex-col gap-5 overflow-y-auto p-3">
          {navSections.map((section) => {
            const items = visibleItems.filter((item) => item.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/40">
                  {section}
                </p>
                {items.map((item) => {
                  const track = String(navItems.indexOf(item) + 1).padStart(2, "0");
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
                          ? "bg-gradient-to-r from-sidebar-primary/20 via-sidebar-accent to-sidebar-accent font-medium text-sidebar-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 inset-y-1.5 w-[3px] rounded-full bg-stage-gradient"
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "w-5 font-mono text-[10px] tabular-nums",
                          isActive ? "text-sidebar-primary" : "text-sidebar-foreground/30",
                        )}
                      >
                        {track}
                      </span>
                      <Icon className="size-[18px] shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <Equalizer bars={3} className="h-3 text-sidebar-primary" />}
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
