import { Suspense } from "react";
import { Users } from "lucide-react";
import { listMembers } from "@/actions/members";
import { MemberActions, NewMemberButton } from "@/components/members/member-dialogs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { isPlaceholderEmail } from "@/lib/members";

const roleLabels = {
  ADMIN: "Administrador",
  MEMBER: "Músico",
  COLLABORATOR: "Equipo",
} as const;

export default async function MembersPage() {
  const [result, session] = await Promise.all([listMembers({ pageSize: 100 }), auth()]);

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const members = result.data.items;
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader title="Miembros" description="Plantilla, colaboradores y contactos del grupo.">
        {isAdmin && (
          <Suspense>
            <NewMemberButton />
          </Suspense>
        )}
      </PageHeader>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin miembros"
          description="Añade a la banda y al equipo con «Añadir componente»."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const name = member.profile?.name ?? member.email;
            const noAccess = isPlaceholderEmail(member.email);
            const initials = name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={member.id} className="stage-edge">
                <CardContent className="flex items-start gap-4 pt-6">
                  <Avatar className="size-14 ring-2 ring-primary/30">
                    <AvatarFallback className="bg-stage-gradient font-display text-lg text-stage-ink">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-2xl uppercase leading-none">{name}</h3>
                    {member.profile?.instrument && (
                      <p className="mt-1 font-serif text-lg italic text-muted-foreground">
                        {member.profile.instrument}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                      {noAccess ? (
                        <Badge variant="outline">Sin acceso</Badge>
                      ) : !member.isActive ? (
                        <Badge variant="outline">Inactivo</Badge>
                      ) : null}
                    </div>
                    {!noAccess && (
                      <p className="mt-2 truncate text-xs text-muted-foreground">{member.email}</p>
                    )}
                    {member.profile?.phone && (
                      <p className="text-xs text-muted-foreground">{member.profile.phone}</p>
                    )}
                  </div>
                  <MemberActions
                    isAdmin={isAdmin}
                    isSelf={session?.user.id === member.id}
                    member={{
                      id: member.id,
                      role: member.role,
                      name,
                      instrument: member.profile?.instrument ?? null,
                      phone: member.profile?.phone ?? null,
                      bio: member.profile?.bio ?? null,
                    }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
