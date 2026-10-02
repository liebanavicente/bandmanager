"use client";

import type { UserRole } from "@prisma/client";
import type { BandSummary } from "@/lib/workspace";
import Link from "next/link";
import { BmLogo } from "@/components/brand/bm-logo";
import { BmWordmark } from "@/components/brand/bm-wordmark";
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-hairline bg-white/90 px-4 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_6px_20px_-12px_rgba(9,9,9,0.18)] backdrop-blur-xl backdrop-saturate-150 sm:px-6 lg:h-[76px] lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
      <Link href="/" className="flex min-w-0 items-center gap-2 lg:hidden" aria-label="Ir al panel">
        <BmLogo size={30} title="" />
        <BmWordmark title="" className="h-[15px] text-ink sm:h-[18px]" />
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
        <MobileNav role={user.role} collaboratorAreas={collaboratorAreas} band={band} />
      </div>
    </header>
  );
}
