"use client";

import Link from "next/link";
import { CalendarPlus, ClipboardPlus, Music2, Plus, Receipt, UserPlus } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { hasPermission, type PermissionArea } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const actions: {
  href: string;
  label: string;
  icon: typeof Plus;
  area: PermissionArea;
  requiresStore?: boolean;
  adminOnly?: boolean;
}[] = [
  { href: "/events/new", label: "Evento", icon: CalendarPlus, area: "events" },
  { href: "/songs/new", label: "Canción", icon: Music2, area: "songs" },
  { href: "/tasks?new=1", label: "Tarea", icon: ClipboardPlus, area: "tasks" },
  { href: "/members?new=1", label: "Componente", icon: UserPlus, area: "members", adminOnly: true },
  { href: "/orders/quick-sale", label: "Venta rápida", icon: Receipt, area: "orders", requiresStore: true },
];

type QuickCreateProps = {
  role: UserRole;
  collaboratorAreas?: string[];
  hasStore: boolean;
  collapsed?: boolean;
  className?: string;
};

/** Botón "Crear" siempre a mano, con los atajos que permite el rol. */
export function QuickCreate({ role, collaboratorAreas, hasStore, collapsed, className }: QuickCreateProps) {
  const visible = actions.filter(
    (a) =>
      hasPermission(role, a.area, collaboratorAreas) &&
      (!a.requiresStore || hasStore) &&
      (!a.adminOnly || role === "ADMIN"),
  );
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size={collapsed ? "icon" : "lg"}
            className={cn("w-full font-display text-base uppercase tracking-wider", collapsed && "size-10", className)}
            aria-label="Crear nuevo"
          />
        }
      >
        <Plus className="size-5" />
        {!collapsed && "Crear"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Añadir a la banda
        </DropdownMenuLabel>
        {visible.map((action) => (
          <DropdownMenuItem key={action.href} render={<Link href={action.href} />}>
            <action.icon />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
