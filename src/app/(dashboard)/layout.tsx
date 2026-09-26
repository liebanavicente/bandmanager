export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCollaboratorAreas, getOptionalSessionUser } from "@/lib/session";
import { getBandSummary } from "@/lib/workspace";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOptionalSessionUser();

  // Sin sesión válida (o dado de baja de la sala): cerrar sesión y al login
  if (!user) {
    redirect("/salir");
  }

  const band = await getBandSummary(user.bandId);

  // Hasta que la banda esté configurada, el administrador pasa por el asistente
  if (!band.onboarded && user.role === "ADMIN") {
    redirect("/onboarding");
  }

  const collaboratorAreas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        role={user.role}
        collaboratorAreas={collaboratorAreas}
        band={band}
        user={user}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} collaboratorAreas={collaboratorAreas} band={band} />
        <main className="flex-1 overflow-x-clip p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
