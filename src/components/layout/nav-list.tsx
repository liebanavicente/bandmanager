"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, navSections, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Equalizer } from "@/components/punk/equalizer";

type NavListProps = {
  items: NavItem[];
  collapsed?: boolean;
  label: string;
  onNavigate?: () => void;
};

function sideLabel(index: number) {
  return `Cara ${String.fromCharCode(65 + index)}`;
}

/**
 * Menú principal como una lista de pistas: caras del disco como secciones,
 * número de pista, rótulo en tipografía de cartel y la pista activa
 * "sonando" con el gradiente de foco y el ecualizador.
 */
export function NavList({ items, collapsed = false, label, onNavigate }: NavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={cn("flex flex-col gap-6 pb-4", collapsed ? "px-2" : "px-3")}>
      {navSections.map((section, sectionIndex) => {
        const sectionItems = items.filter((item) => item.section === section);
        if (sectionItems.length === 0) return null;
        return (
          <div key={section} className="flex flex-col gap-1">
            {collapsed ? (
              <span aria-hidden="true" className="mx-auto mb-1 h-px w-6 bg-sidebar-foreground/15" />
            ) : (
              <p className="flex items-baseline gap-2 px-2 pb-1">
                <span className="font-display text-[13px] uppercase tracking-wider text-sidebar-primary">
                  {sideLabel(sectionIndex)}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/40">
                  {section}
                </span>
                <span aria-hidden="true" className="h-px flex-1 translate-y-[-3px] bg-sidebar-foreground/10" />
              </p>
            )}
            {sectionItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const track = String(navItems.indexOf(item) + 1).padStart(2, "0");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-lg px-2.5 py-2 transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-stage-gradient text-stage-ink shadow-poster-red"
                      : "text-sidebar-foreground/70 hover:translate-x-1 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  {!collapsed && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-5 font-mono text-[10px] tabular-nums transition-colors",
                        isActive
                          ? "text-stage-ink/70"
                          : "text-sidebar-foreground/30 group-hover:text-sidebar-primary",
                      )}
                    >
                      {track}
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md transition-all",
                      isActive
                        ? "bg-stage-ink/15"
                        : "bg-sidebar-accent group-hover:rotate-[-6deg] group-hover:bg-sidebar-primary/20 group-hover:text-sidebar-primary",
                    )}
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  {!collapsed && (
                    <span className="flex-1 truncate font-display text-[17px] uppercase leading-none tracking-wide">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && isActive && <Equalizer bars={4} className="h-3.5 text-stage-ink" />}
                  {/* Barrido de luz al pasar el ratón */}
                  {!isActive && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-[3px] origin-left scale-y-0 rounded-full bg-stage-gradient transition-transform duration-200 group-hover:scale-y-100"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
