"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle>BandManager</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
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
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <p className="p-4 text-xs text-muted-foreground">
          Navegación rápida para móvil y tablet.
        </p>
      </SheetContent>
    </Sheet>
  );
}