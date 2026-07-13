import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import type { TaskStatus } from "@prisma/client";
import { listTasks } from "@/actions/tasks";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";

const taskStatusOptions = [
  { value: "PENDING", label: "Pendiente" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "BLOCKED", label: "Bloqueada" },
  { value: "DONE", label: "Hecha" },
];

const priorityLabels = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
} as const;

async function TasksList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: TaskStatus }>;
}) {
  const params = await searchParams;
  const result = await listTasks({ search: params.q, status: params.status });

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const tasks = result.data.items;

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Sin tareas"
        description="Organiza logística, producción y merchandising."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{task.title}</h3>
                <StatusBadge kind="task" status={task.status} />
              </div>
              {task.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {task.assignee?.profile?.name ?? "Sin asignar"}
                {task.dueAt &&
                  ` · Vence ${format(task.dueAt, "d MMM yyyy", { locale: es })}`}
                {task.event && ` · ${task.event.title}`}
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {priorityLabels[task.priority]}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: TaskStatus }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Seguimiento de pendientes del grupo."
      />

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <SearchFilters
          searchPlaceholder="Buscar tareas…"
          statusOptions={taskStatusOptions}
        />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <TasksList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}