"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, User } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { navItems, navSections } from "@/lib/navigation";
import { hasPermission } from "@/lib/permissions";
import { BAND_NAME } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { BmLogo } from "@/components/brand/bm-logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MEMBER: "Miembro",
  COLLABORATOR: "Colaborador",
};

type AppSidebarProps = {
  role: UserRole;
  collaboratorAreas?: string[];
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
};

export function AppSidebar({ role, collaboratorAreas, user }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Persistencia local de la preferencia de colapso (solo escritorio)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setCollapsed(window.localStorage.getItem("bm-sidebar-collapsed") === "1");
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      window.localStorage.setItem("bm-sidebar-collapsed", prev ? "0" : "1");
      return !prev;
    });
  }

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && role !== "ADMIN") return false;
    return hasPermission(role, item.area, collaboratorAreas);
  });

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Marca */}
      <div
        className={cn(
          "flex h-16 items-center gap-3 border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <BmLogo size={32} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide">BandManager</p>
            <p className="text-[11px] text-muted-foreground">Gestión de banda</p>
          </div>
        )}
      </div>

      {/* Selector de banda (un solo espacio de trabajo por ahora) */}
      <div className={cn("py-3", collapsed ? "px-2" : "px-3")}>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? BAND_NAME : undefined}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15 text-[10px] font-bold text-sidebar-primary">
            {BAND_NAME.slice(0, 2).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-medium">{BAND_NAME}</span>
          )}
        </div>
      </div>

      {/* Navegación por secciones */}
      <ScrollArea className="flex-1">
        <nav
          aria-label="Navegación principal"
          className={cn("flex flex-col gap-5 pb-4", collapsed ? "px-2" : "px-3")}
        >
          {navSections.map((section) => {
            const items = visibleItems.filter((item) => item.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section} className="flex flex-col gap-0.5">
                {!collapsed && (
                  <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                    {section}
                  </p>
                )}
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
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        collapsed && "justify-center px-2",
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
                      <Icon
                        className={cn(
                          "size-[18px] shrink-0",
                          isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground",
                        )}
                      />
                      {!collapsed && item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Pie: colapsar + perfil de usuario */}
      <div
        className={cn(
          "flex flex-col gap-2 border-t border-sidebar-border p-3",
          collapsed && "items-center px-2",
        )}
      >
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          className={cn("text-muted-foreground", !collapsed && "justify-start gap-2")}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Contraer"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  collapsed && "w-auto justify-center px-1",
                )}
                aria-label="Menú de usuario"
              />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-sidebar-primary text-[11px] font-semibold text-sidebar-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{user.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {roleLabels[user.role]}
                </span>
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                <span className="mt-1 inline-block w-fit rounded-sm border border-primary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary">
                  {roleLabels[user.role]}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="size-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
