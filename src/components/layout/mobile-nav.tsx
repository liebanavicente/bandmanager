"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Music4 } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { navItems } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type MobileNavProps = {
  role: UserRole;
  collaboratorAreas?: string[];
};

export function MobileNav({ role, collaboratorAreas }: MobileNavProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && role !== "ADMIN") return false;
    return hasPermission(role, item.area, collaboratorAreas);
  });

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon" className="lg:hidden" />
        }
      >
        <Menu className="size-4" />
        <span className="sr-only">Abrir menú</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2.5">
            <span className="flex size-8 -rotate-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Music4 className="size-4" />
            </span>
            <span className="font-display text-sm uppercase tracking-widest">BandManager</span>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Navegación móvil" className="flex flex-col gap-1 p-3">
          {visibleItems.map((item) => {
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
                  "flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Separator className="bg-sidebar-border" />
        <p className="p-4 text-[11px] uppercase tracking-wider text-muted-foreground">
          Navegación rápida para móvil y tablet.
        </p>
      </SheetContent>
    </Sheet>
  );
}
