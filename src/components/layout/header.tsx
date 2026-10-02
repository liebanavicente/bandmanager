"use client";

import type { UserRole } from "@prisma/client";
import type { BandSummary } from "@/lib/workspace";
import Link from "next/link";
import { BmLogo } from "@/components/brand/bm-logo";
import { FeedbackButton } from "@/components/feedback/feedback-button";
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
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b-2 border-ink bg-white/80 px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-6 lg:h-14 lg:border-b lg:border-hairline lg:bg-transparent lg:backdrop-blur-none">
      <MobileNav role={user.role} collaboratorAreas={collaboratorAreas} band={band} />
      <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="Ir al panel">
        <BmLogo size={28} title="" />
        <span className="poster-title text-xl">BandManager</span>
      </Link>

      <div className="flex flex-1 items-center justify-end gap-2">
        <FeedbackButton />

        {/* Menú de usuario: en escritorio vive al pie de la sidebar */}
        <div className="lg:hidden">
          <UserMenu
            user={user}
            band={band}
            trigger={
              <Button variant="ghost" className="gap-2 px-2" aria-label="Menú de usuario">
                <Avatar className="size-8 ring-1 ring-ink">
                  <AvatarFallback className="bg-stage-gradient text-[11px] font-extrabold text-band-ink">
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
