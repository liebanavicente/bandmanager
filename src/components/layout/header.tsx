"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { UserRole } from "@prisma/client";
import type { BandSummary } from "@/lib/workspace";
import Link from "next/link";
import { BmLogo } from "@/components/brand/bm-logo";
import { UserMenu, userInitials } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  collaboratorAreas?: string[];
  band: BandSummary;
};

export function Header({ user, collaboratorAreas, band }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Filete inferior: línea de luz que se apaga hacia la derecha */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-stage-red/70 via-border to-border"
      />
      <MobileNav role={user.role} collaboratorAreas={collaboratorAreas} band={band} />
      <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="Ir al panel">
        <BmLogo size={26} title="" />
        <span className="poster-title text-lg">
          Band<span className="text-stage-gradient">Manager</span>
        </span>
      </Link>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Cambiar tema"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Menú de usuario: en escritorio vive al pie de la sidebar */}
        <div className="lg:hidden">
          <UserMenu
            user={user}
            band={band}
            trigger={
              <Button variant="ghost" className="gap-2 px-2" aria-label="Menú de usuario">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-stage-gradient text-[11px] font-semibold text-stage-ink">
                    {userInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
        </div>
      </div>
    </header>
  );
}
