"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music4 } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { navItems } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Equalizer } from "@/components/punk/equalizer";
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
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex size-9 -rotate-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-poster-sm">
          <Music4 className="size-4" />
        </div>
        <div>
          <p className="font-display text-sm uppercase leading-tight tracking-widest">
            BandManager
          </p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Backstage
          </p>
        </div>
      </div>
      <Separator className="bg-sidebar-border" />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav aria-label="Navegación principal" className="flex flex-col gap-1">
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
                  "group flex items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground shadow-poster-sm"
                    : "text-sidebar-foreground hover:border-sidebar-border hover:bg-sidebar-accent hover:translate-x-0.5",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="flex items-center justify-between border-t border-sidebar-border p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Ensayo · Directo · Merch
        </p>
        <Equalizer className="text-sidebar-primary" bars={4} />
      </div>
    </aside>
  );
}
