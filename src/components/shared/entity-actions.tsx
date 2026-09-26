"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteEvent } from "@/actions/events";
import { deleteFile } from "@/actions/files";
import { removeMember } from "@/actions/members";
import { deleteOrder } from "@/actions/orders";
import { deleteProduct } from "@/actions/products";
import { deleteRepertoire } from "@/actions/repertoires";
import { deleteSetlist } from "@/actions/setlists";
import { deleteSong } from "@/actions/songs";
import { deleteTask } from "@/actions/tasks";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Result = { success: true; data: unknown } | { error: string };

const entities = {
  song: { remove: deleteSong, noun: "la canción", after: "/songs" },
  event: { remove: deleteEvent, noun: "el evento", after: "/events" },
  task: { remove: deleteTask, noun: "la tarea", after: "/tasks" },
  product: { remove: deleteProduct, noun: "el producto", after: "/products" },
  repertoire: { remove: deleteRepertoire, noun: "el repertorio", after: "/repertoires" },
  setlist: { remove: deleteSetlist, noun: "el setlist", after: "/setlists" },
  file: { remove: deleteFile, noun: "el archivo", after: "/files" },
  order: { remove: deleteOrder, noun: "el pedido", after: "/orders" },
  member: { remove: removeMember, noun: "a", after: "/members" },
} satisfies Record<string, { remove: (id: string) => Promise<Result>; noun: string; after: string }>;

export type EntityKind = keyof typeof entities;

type EntityActionsProps = {
  entity: EntityKind;
  id: string;
  /** Nombre visible del elemento, para el diálogo de confirmación. */
  name: string;
  editHref?: string;
  onEdit?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  /** "menu": botón ⋯ para filas; "buttons": botones visibles para fichas. */
  variant?: "menu" | "buttons";
  /** Tras borrar desde una ficha, volver al listado. */
  redirectAfterDelete?: boolean;
  extraDescription?: string;
  className?: string;
};

/** Acciones de editar y eliminar, con confirmación, para cualquier elemento. */
export function EntityActions({
  entity,
  id,
  name,
  editHref,
  onEdit,
  canEdit = true,
  canDelete = true,
  variant = "menu",
  redirectAfterDelete = false,
  extraDescription,
  className,
}: EntityActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const config = entities[entity];
  const hasEdit = canEdit && (editHref || onEdit);

  if (!hasEdit && !canDelete) return null;

  function handleDelete() {
    startTransition(async () => {
      const result = await config.remove(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setConfirmOpen(false);
      toast.success(`«${name}» eliminado`);
      if (redirectAfterDelete) router.push(config.after);
      else router.refresh();
    });
  }

  const dialog = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={`¿Eliminar ${config.noun} «${name}»?`}
      description={extraDescription ?? "Esta acción no se puede deshacer desde la aplicación."}
      confirmLabel="Eliminar"
      variant="destructive"
      loading={pending}
      onConfirm={handleDelete}
    />
  );

  if (variant === "buttons") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {hasEdit &&
          (editHref ? (
            <Button variant="outline" nativeButton={false} render={<Link href={editHref} />}>
              <Pencil />
              Editar
            </Button>
          ) : (
            <Button variant="outline" onClick={onEdit}>
              <Pencil />
              Editar
            </Button>
          ))}
        {canDelete && (
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
            Eliminar
          </Button>
        )}
        {dialog}
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn("relative z-10 text-muted-foreground hover:text-foreground", className)}
              aria-label={`Acciones para ${name}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {hasEdit &&
            (editHref ? (
              <DropdownMenuItem render={<Link href={editHref} />}>
                <Pencil />
                Editar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                Editar
              </DropdownMenuItem>
            ))}
          {hasEdit && canDelete && <DropdownMenuSeparator />}
          {canDelete && (
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog}
    </>
  );
}
