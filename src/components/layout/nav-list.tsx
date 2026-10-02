"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
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
  /** "mobile": menú a pantalla completa con rótulos grandes. */
  variant?: "sidebar" | "mobile";
};

function sideLabel(index: number) {
  return `Cara ${String.fromCharCode(65 + index)}`;
}

function isActiveHref(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

type Indicator = { top: number; height: number; visible: boolean };

/**
 * Menú principal como la cara de un disco: secciones "Cara A/B/C", número
 * de pista y rótulo. Un bloque del acento de la banda se desliza hasta la
 * pista que señalas y descansa en la que suena (la página actual), con su
 * ecualizador.
 */
export function NavList({ items, collapsed = false, label, onNavigate, variant = "sidebar" }: NavListProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [indicator, setIndicator] = useState<Indicator>({ top: 0, height: 0, visible: false });

  const target = hovered ?? items.find((item) => isActiveHref(pathname, item.href))?.href ?? null;

  const measure = useCallback(() => {
    const nav = navRef.current;
    const link = target ? nav?.querySelector<HTMLElement>(`[data-href="${target}"]`) : null;
    if (!nav || !link) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }
    setIndicator({ top: link.offsetTop, height: link.offsetHeight, visible: true });
  }, [target]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, collapsed]);

  if (variant === "mobile") {
    return (
      <nav aria-label={label} className="flex flex-col gap-6 px-4 pb-8">
        {navSections.map((section, sectionIndex) => {
          const sectionItems = items.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;
          return (
            <div key={section}>
              <p className="mb-1 flex items-baseline gap-2 text-[11px] font-extrabold uppercase text-muted-foreground">
                <span className="text-band-text">{sideLabel(sectionIndex)}</span>
                {section}
              </p>
              <ul className="border-t-2 border-ink">
                {sectionItems.map((item, i) => {
                  const isActive = isActiveHref(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.href}
                      className="animate-rise-in border-b border-ink"
                      style={{ animationDelay: `${(sectionIndex * 4 + i) * 35}ms` }}
                    >
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3.5 px-1 py-3.5 text-[1.65rem] leading-none font-extrabold transition-colors active:bg-ink active:text-band-bright",
                          isActive && "bg-band pl-3 text-band-ink",
                        )}
                      >
                        <Icon className="size-6 shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive && <Equalizer bars={4} className="mr-2 h-4" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      ref={navRef}
      aria-label={label}
      onMouseLeave={() => setHovered(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(null);
      }}
      className={cn("relative flex flex-col gap-5 pb-4", collapsed ? "px-2" : "px-3")}
    >
      {/* Bloque del acento que se desliza entre pistas */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute rounded-[10px] border border-ink bg-band transition-[transform,height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "inset-x-2" : "inset-x-3",
        )}
        style={{
          top: 0,
          height: indicator.height,
          transform: `translateY(${indicator.top}px)`,
          opacity: indicator.visible ? 1 : 0,
        }}
      />
      {navSections.map((section, sectionIndex) => {
        const sectionItems = items.filter((item) => item.section === section);
        if (sectionItems.length === 0) return null;
        return (
          <div key={section} className="flex flex-col gap-0.5">
            {collapsed ? (
              <span aria-hidden="true" className="mx-auto mb-1 h-px w-6 bg-hairline" />
            ) : (
              <p className="flex items-baseline gap-2 px-2.5 pb-1.5 text-[10px] font-extrabold uppercase">
                <span className="text-band-text">{sideLabel(sectionIndex)}</span>
                <span className="text-muted-foreground">{section}</span>
                <span aria-hidden="true" className="h-px flex-1 translate-y-[-3px] bg-hairline" />
              </p>
            )}
            {sectionItems.map((item) => {
              const isActive = isActiveHref(pathname, item.href);
              const isLit = (hovered ?? (isActive ? item.href : null)) === item.href;
              const Icon = item.icon;
              const track = String(navItems.indexOf(item) + 1).padStart(2, "0");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-href={item.href}
                  onClick={onNavigate}
                  onMouseEnter={() => setHovered(item.href)}
                  onFocus={() => setHovered(item.href)}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative z-10 flex min-h-10 items-center gap-3 rounded-[10px] px-2.5 py-2 text-[15px] transition-colors duration-200",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                    collapsed && "justify-center px-0",
                    isActive ? "font-extrabold" : "font-semibold",
                    isLit ? "text-band-ink" : "text-foreground/80",
                  )}
                >
                  {!collapsed && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "w-5 text-[10px] font-bold tabular-nums transition-colors",
                        isLit ? "opacity-70" : "text-muted-foreground",
                      )}
                    >
                      {track}
                    </span>
                  )}
                  <Icon
                    className={cn("size-[18px] shrink-0 transition-transform duration-200", !isLit && "group-hover:-rotate-6")}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && isActive && <Equalizer bars={4} className="h-3.5" />}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
