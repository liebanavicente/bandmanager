"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music4 } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { navItems } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type AppSidebarProps = {
  role: UserRole;
  collaboratorAreas?: string[];
};

export function AppSidebar({ role, collaboratorAreas }: AppSidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && role !== "ADMIN") return false;
    return hasPermission(role, item.area, collaboratorAreas);
  });

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Music4 className="size-4" />
        </div>
        <div>
          <p className="font-heading text-sm font-semibold">BandManager</p>
          <p className="text-xs text-muted-foreground">Gestión de banda</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Ensayos, conciertos y merch en un solo lugar.
        </p>
      </div>
    </aside>
  );
}