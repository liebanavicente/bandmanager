import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  ListMusic,
  Music2,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { PermissionArea } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  area: PermissionArea;
  adminOnly?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Panel", icon: LayoutDashboard, area: "dashboard" },
  { href: "/events", label: "Eventos", icon: Calendar, area: "events" },
  { href: "/songs", label: "Canciones", icon: Music2, area: "songs" },
  { href: "/repertoires", label: "Repertorios", icon: ListMusic, area: "repertoires" },
  { href: "/setlists", label: "Setlists", icon: ListMusic, area: "setlists" },
  { href: "/members", label: "Miembros", icon: Users, area: "members" },
  { href: "/tasks", label: "Tareas", icon: ClipboardList, area: "tasks" },
  { href: "/files", label: "Archivos", icon: FolderOpen, area: "files" },
  { href: "/products", label: "Productos", icon: Package, area: "products" },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart, area: "orders" },
  {
    href: "/settings",
    label: "Ajustes",
    icon: Settings,
    area: "settings",
    adminOnly: true,
  },
];