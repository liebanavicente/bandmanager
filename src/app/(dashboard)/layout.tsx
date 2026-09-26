export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCollaboratorAreas } from "@/lib/session";
import { getBandSummary } from "@/lib/workspace";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const band = await getBandSummary();

  // Hasta que la banda esté configurada, el administrador pasa por el asistente
  if (!band.onboarded && session.user.role === "ADMIN") {
    redirect("/onboarding");
  }

  const collaboratorAreas =
    session.user.role === "COLLABORATOR"
      ? await getCollaboratorAreas(session.user.id)
      : undefined;

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        role={session.user.role}
        collaboratorAreas={collaboratorAreas}
        band={band}
        user={session.user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={session.user} collaboratorAreas={collaboratorAreas} band={band} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
