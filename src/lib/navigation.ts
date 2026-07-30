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

export type NavSection = "General" | "Música" | "Gestión" | "Sistema";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  area: PermissionArea;
  section: NavSection;
  adminOnly?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Panel", icon: LayoutDashboard, area: "dashboard", section: "General" },
  { href: "/events", label: "Eventos", icon: Calendar, area: "events", section: "General" },
  { href: "/tasks", label: "Tareas", icon: ClipboardList, area: "tasks", section: "General" },
  { href: "/members", label: "Miembros", icon: Users, area: "members", section: "General" },
  { href: "/songs", label: "Canciones", icon: Music2, area: "songs", section: "Música" },
  { href: "/repertoires", label: "Repertorios", icon: ListMusic, area: "repertoires", section: "Música" },
  { href: "/setlists", label: "Setlists", icon: ListMusic, area: "setlists", section: "Música" },
  { href: "/products", label: "Productos", icon: Package, area: "products", section: "Gestión" },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart, area: "orders", section: "Gestión" },
  { href: "/files", label: "Archivos", icon: FolderOpen, area: "files", section: "Gestión" },
  {
    href: "/settings",
    label: "Ajustes",
    icon: Settings,
    area: "settings",
    section: "Sistema",
    adminOnly: true,
  },
];

export const navSections: NavSection[] = ["General", "Música", "Gestión", "Sistema"];
