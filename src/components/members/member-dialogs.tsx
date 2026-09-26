"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, UserPlus } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { createMember, updateMember } from "@/actions/members";
import { EntityActions } from "@/components/shared/entity-actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type MemberDraft = {
  id: string;
  role: UserRole;
  name: string;
  instrument: string | null;
  phone: string | null;
  bio: string | null;
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MEMBER", label: "Músico" },
  { value: "COLLABORATOR", label: "Equipo / colaborador" },
];
const newRoleOptions = roleOptions.filter((r) => r.value !== "ADMIN") as {
  value: "MEMBER" | "COLLABORATOR";
  label: string;
}[];

function EditMemberDialog({
  member,
  isAdmin,
  open,
  onOpenChange,
}: {
  member: MemberDraft;
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>(member.role);

  async function handleSubmit(form: FormData) {
    setLoading(true);
    const result = await updateMember({
      id: member.id,
      name: form.get("name"),
      instrument: form.get("instrument") ?? "",
      phone: form.get("phone") ?? "",
      bio: form.get("bio") ?? "",
      ...(isAdmin && role !== member.role ? { role } : {}),
    });
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Ficha actualizada");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      kicker="Editar componente"
      title={member.name}
      submitLabel="Guardar cambios"
      loading={loading}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="m-name">Nombre</Label>
          <Input id="m-name" name="name" required defaultValue={member.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-instrument">Función</Label>
          <Input id="m-instrument" name="instrument" defaultValue={member.instrument ?? ""} placeholder="Bajo, técnico de sonido…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="m-phone">Teléfono</Label>
          <Input id="m-phone" name="phone" type="tel" defaultValue={member.phone ?? ""} />
        </div>
        {isAdmin && (
          <div className="space-y-2">
            <Label>Rol</Label>
            <OptionSelect value={role} onValueChange={setRole} options={roleOptions} aria-label="Rol" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="m-bio">Bio</Label>
        <Textarea id="m-bio" name="bio" rows={2} defaultValue={member.bio ?? ""} />
      </div>
    </FormDialog>
  );
}

/** Alta de componente; se abre solo con ?new=1 (atajo de "Crear"). */
export function NewMemberButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const wantsNew = searchParams.get("new") === "1";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"MEMBER" | "COLLABORATOR">("MEMBER");
  const [pass, setPass] = useState<{ name: string; email: string; password: string } | null>(null);

  useEffect(() => {
    if (!wantsNew) return;
    const raf = requestAnimationFrame(() => setOpen(true));
    router.replace(pathname, { scroll: false });
    return () => cancelAnimationFrame(raf);
  }, [wantsNew, pathname, router]);

  async function handleSubmit(form: FormData) {
    setLoading(true);
    const result = await createMember({
      name: form.get("name"),
      instrument: form.get("instrument") ?? "",
      email: form.get("email") ?? "",
      role,
    });
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
    const { name, email, tempPassword } = result.data;
    if (email && tempPassword) {
      setPass({ name, email, password: tempPassword });
    } else {
      toast.success(`${name} añadido a la banda`);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus />
        Añadir componente
      </Button>
      {open && (
        <FormDialog
          open={open}
          onOpenChange={setOpen}
          kicker="Nuevo componente"
          title="¿Quién se sube al escenario?"
          description="Con email le creamos acceso con una contraseña temporal; sin email queda como ficha."
          submitLabel="Añadir"
          loading={loading}
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="n-name">Nombre</Label>
              <Input id="n-name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-instrument">Función</Label>
              <Input id="n-instrument" name="instrument" placeholder="Batería" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-email">Email (opcional)</Label>
            <Input id="n-email" name="email" type="email" placeholder="para darle acceso" />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <OptionSelect value={role} onValueChange={setRole} options={newRoleOptions} aria-label="Tipo" />
          </div>
        </FormDialog>
      )}
      <Dialog open={Boolean(pass)} onOpenChange={(o) => !o && setPass(null)}>
        <DialogContent className="border-t-2 border-t-stage-red sm:max-w-md">
          <DialogHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Pase all access</p>
            <DialogTitle className="poster-title text-3xl">{pass?.name}, dentro</DialogTitle>
            <DialogDescription className="font-serif text-base italic">
              Comparte estos datos ahora: la contraseña temporal no se volverá a mostrar.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-3 font-mono text-sm">
            <p>{pass?.email}</p>
            <p className="text-primary">{pass?.password}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                pass &&
                navigator.clipboard.writeText(`${pass.email} / ${pass.password}`).then(
                  () => toast.success("Copiado"),
                  () => toast.error("No se pudo copiar"),
                )
              }
            >
              <Copy />
              Copiar
            </Button>
            <Button onClick={() => setPass(null)}>Hecho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MemberActions({
  member,
  isAdmin,
  isSelf,
}: {
  member: MemberDraft;
  isAdmin: boolean;
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <EntityActions
        entity="member"
        id={member.id}
        name={member.name}
        onEdit={() => setEditing(true)}
        canEdit={isAdmin || isSelf}
        canDelete={isAdmin && !isSelf}
        extraDescription="Dejará de aparecer en la banda y perderá el acceso."
      />
      {editing && (
        <EditMemberDialog member={member} isAdmin={isAdmin} open={editing} onOpenChange={setEditing} />
      )}
    </>
  );
}
