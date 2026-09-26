"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@prisma/client";
import { toast } from "sonner";
import { createTask, updateTask } from "@/actions/tasks";
import { EntityActions } from "@/components/shared/entity-actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type TaskDraft = Pick<
  Task,
  "id" | "title" | "description" | "assigneeId" | "dueAt" | "priority" | "status" | "category"
>;
export type Assignee = { id: string; name: string };

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];
const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "BLOCKED", label: "Bloqueada" },
  { value: "DONE", label: "Hecha" },
];
const UNASSIGNED = "none";

type TaskDialogProps = {
  task?: TaskDraft;
  assignees: Assignee[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaskDialog({ task, assignees, open, onOpenChange }: TaskDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "PENDING");
  const [assignee, setAssignee] = useState(task?.assigneeId ?? UNASSIGNED);

  const assigneeOptions = [
    { value: UNASSIGNED, label: "Sin asignar" },
    ...assignees.map((a) => ({ value: a.id, label: a.name })),
  ];

  async function handleSubmit(form: FormData) {
    setLoading(true);
    const due = (form.get("dueAt") as string) || "";
    const payload = {
      title: form.get("title") as string,
      description: (form.get("description") as string) ?? "",
      category: (form.get("category") as string) ?? "",
      dueAt: due ? new Date(`${due}T12:00:00`).toISOString() : task ? "" : undefined,
      priority,
      status,
      assigneeId: assignee === UNASSIGNED ? (task ? "" : undefined) : assignee,
    };
    const result = task ? await updateTask({ id: task.id, ...payload }) : await createTask(payload);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(task ? "Tarea actualizada" : "Tarea creada");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      kicker={task ? "Editar tarea" : "Nueva tarea"}
      title={task ? task.title : "¿Qué hay que hacer?"}
      submitLabel={task ? "Guardar cambios" : "Crear tarea"}
      loading={loading}
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="task-title">Título</Label>
        <Input id="task-title" name="title" required defaultValue={task?.title} placeholder="Confirmar backline con la sala" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-description">Descripción</Label>
        <Textarea id="task-description" name="description" rows={3} defaultValue={task?.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Responsable</Label>
          <OptionSelect value={assignee} onValueChange={setAssignee} options={assigneeOptions} aria-label="Responsable" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-due">Fecha límite</Label>
          <Input
            id="task-due"
            name="dueAt"
            type="date"
            defaultValue={task?.dueAt ? format(task.dueAt, "yyyy-MM-dd") : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <OptionSelect value={priority} onValueChange={setPriority} options={priorityOptions} aria-label="Prioridad" />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <OptionSelect value={status} onValueChange={setStatus} options={statusOptions} aria-label="Estado" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="task-category">Categoría</Label>
        <Input id="task-category" name="category" defaultValue={task?.category ?? ""} placeholder="Logística, promo, merch…" />
      </div>
    </FormDialog>
  );
}

/** Botón "Nueva tarea"; se abre solo si la URL trae ?new=1 (atajo de "Crear"). */
export function NewTaskButton({ assignees }: { assignees: Assignee[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const wantsNew = searchParams.get("new") === "1";

  useEffect(() => {
    if (!wantsNew) return;
    const raf = requestAnimationFrame(() => setOpen(true));
    router.replace(pathname, { scroll: false });
    return () => cancelAnimationFrame(raf);
  }, [wantsNew, pathname, router]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nueva tarea
      </Button>
      {open && <TaskDialog assignees={assignees} open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function TaskActions({ task, assignees }: { task: TaskDraft; assignees: Assignee[] }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <EntityActions entity="task" id={task.id} name={task.title} onEdit={() => setEditing(true)} />
      {editing && <TaskDialog task={task} assignees={assignees} open={editing} onOpenChange={setEditing} />}
    </>
  );
}
