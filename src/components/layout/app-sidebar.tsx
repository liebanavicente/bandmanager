"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronsLeft, ChevronsRight, Settings2, Sparkles, UserPlus } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { BandSummary } from "@/lib/workspace";
import { BmLogo } from "@/components/brand/bm-logo";
import { BandBadge } from "@/components/layout/band-badge";
import { InviteCard } from "@/components/band/invite-card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LogoutButton } from "@/components/layout/logout-button";
import { NavList } from "@/components/layout/nav-list";
import { QuickCreate } from "@/components/layout/quick-create";
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

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MEMBER: "Miembro",
  COLLABORATOR: "Colaborador",
};

type AppSidebarProps = {
  role: UserRole;
  collaboratorAreas?: string[];
  band: BandSummary;
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
};

export function visibleNavItems(role: UserRole, hasStore: boolean, collaboratorAreas?: string[]) {
  return navItems.filter((item) => {
    if (item.adminOnly && role !== "ADMIN") return false;
    if (item.requiresStore && !hasStore) return false;
    return hasPermission(role, item.area, collaboratorAreas);
  });
}

export function userInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppSidebar({ role, collaboratorAreas, band, user }: AppSidebarProps) {
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

  const items = visibleNavItems(role, band.hasStore, collaboratorAreas);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[1px_0_0_rgba(255,255,255,0.8)_inset] backdrop-blur-2xl backdrop-saturate-150 transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-72",
      )}
    >
      {/* Marca */}
      <div
        className={cn(
          "flex h-[72px] items-center gap-3 border-b-2 border-ink",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Link href="/" aria-label="Ir al panel" className="flex items-center gap-3">
          <BmLogo size={36} className="transition-transform duration-700 hover:rotate-[200deg]" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="poster-title block truncate text-[1.6rem] leading-none">BandManager</span>
              <span className="mt-1 inline-block bg-ink px-1.5 py-0.5 text-[9px] font-extrabold uppercase leading-none text-band-bright">
                Backstage
              </span>
            </span>
          )}
        </Link>
      </div>

      {/* Banda + crear */}
      <div className={cn("flex flex-col gap-3 py-4", collapsed ? "items-center px-2" : "px-3")}>
        <BandBadge band={band} collapsed={collapsed} className={cn(collapsed && "w-full")} />
        <QuickCreate
          role={role}
          collaboratorAreas={collaboratorAreas}
          hasStore={band.hasStore}
          collapsed={collapsed}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <NavList items={items} collapsed={collapsed} label="Navegación principal" />
      </ScrollArea>

      {/* Pie: colapsar + perfil de usuario */}
      <div
        className={cn(
          "flex flex-col gap-2 border-t border-ink/15 p-3",
          collapsed && "items-center px-2",
        )}
      >
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          className={cn(
            "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
            !collapsed && "justify-start gap-2",
          )}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Contraer"}
        </Button>

        <UserMenu user={user} band={band} collapsed={collapsed} />
      </div>
    </aside>
  );
}

export function UserMenu({
  user,
  band,
  collapsed = false,
  trigger,
}: {
  user: AppSidebarProps["user"];
  band: BandSummary;
  collapsed?: boolean;
  trigger?: React.ReactElement;
}) {
  const initials = userInitials(user.name);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          trigger ?? (
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                collapsed && "w-auto justify-center px-1",
              )}
              aria-label="Menú de usuario"
            />
          )
        }
      >
        {trigger ? null : (
          <>
            <Avatar className="size-9 ring-1 ring-ink">
              <AvatarFallback className="bg-stage-gradient text-[11px] font-extrabold text-band-ink">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{user.name}</span>
                <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                  {roleLabels[user.role]}
                </span>
              </span>
            )}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="font-display text-lg uppercase leading-none">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            <span className="eyebrow mt-1.5 w-fit px-1.5 py-0.5 text-[10px]">
              {roleLabels[user.role]}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setInviteOpen(true)}>
          <UserPlus />
          Invitar a la sala
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings2 />
              Ficha de la banda
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/onboarding" />}>
              <Sparkles />
              Asistente de configuración
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-transparent p-0 ring-0 sm:max-w-xl" showCloseButton={false}>
          <DialogTitle className="sr-only">Invitar a la sala</DialogTitle>
          <InviteCard code={band.inviteCode} bandName={band.name} canRegenerate={user.role === "ADMIN"} />
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
