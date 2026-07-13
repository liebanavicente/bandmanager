import { Users } from "lucide-react";
import { listMembers } from "@/actions/members";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isActionSuccess } from "@/lib/action-result";

const roleLabels = {
  ADMIN: "Administrador",
  MEMBER: "Miembro",
  COLLABORATOR: "Colaborador",
} as const;

export default async function MembersPage() {
  const result = await listMembers({ isActive: true, pageSize: 100 });

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const members = result.data.items;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Miembros"
        description="Plantilla, colaboradores y contactos del grupo."
      />

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin miembros"
          description="Invita a la banda y colaboradores al sistema."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const name = member.profile?.name ?? member.email;
            const initials = name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={member.id}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{name}</h3>
                      <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {member.email}
                    </p>
                    {member.profile?.instrument && (
                      <p className="mt-1 text-sm">{member.profile.instrument}</p>
                    )}
                    {member.profile?.phone && (
                      <p className="text-xs text-muted-foreground">
                        {member.profile.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}