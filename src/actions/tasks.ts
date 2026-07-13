"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { canManage, requirePermission } from "@/lib/permissions";
import {
  createTaskCommentSchema,
  createTaskSchema,
  taskFiltersSchema,
  updateTaskSchema,
} from "@/lib/validations";

async function authorizeTasks() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "tasks", areas);
  return user;
}

export async function listTasks(input: unknown = {}) {
  try {
    await authorizeTasks();
    const parsed = taskFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, status, priority, assigneeId, eventId } = parsed.data;
    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(eventId ? { eventId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          assignee: { include: { profile: true } },
          creator: { include: { profile: true } },
          event: true,
          _count: { select: { comments: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { success: true as const, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getTask(id: string) {
  try {
    await authorizeTasks();
    const task = await prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignee: { include: { profile: true } },
        creator: { include: { profile: true } },
        event: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: { user: { include: { profile: true } } },
        },
        files: { where: { deletedAt: null } },
      },
    });

    if (!task) {
      throw new AppError("Tarea no encontrada.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: task };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createTask(input: unknown) {
  try {
    const user = await authorizeTasks();
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la tarea inválidos.", "VALIDATION", 400);
    }

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        creatorId: user.id,
      },
      include: {
        assignee: { include: { profile: true } },
        creator: { include: { profile: true } },
        event: true,
      },
    });

    return { success: true as const, data: task };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateTask(input: unknown) {
  try {
    const user = await authorizeTasks();
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la tarea inválidos.", "VALIDATION", 400);
    }

    const { id, ...data } = parsed.data;
    const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Tarea no encontrada.", "NOT_FOUND", 404);
    }

    if (!canManage(user.role, "tasks") && existing.assigneeId !== user.id) {
      throw new AppError("No tienes permisos para editar esta tarea.", "FORBIDDEN", 403);
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { include: { profile: true } },
        creator: { include: { profile: true } },
        event: true,
      },
    });

    return { success: true as const, data: task };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteTask(id: string) {
  try {
    const user = await authorizeTasks();
    const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Tarea no encontrada.", "NOT_FOUND", 404);
    }

    if (!canManage(user.role, "tasks") && existing.creatorId !== user.id) {
      throw new AppError("No tienes permisos para eliminar esta tarea.", "FORBIDDEN", 403);
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addTaskComment(input: unknown) {
  try {
    const user = await authorizeTasks();
    const parsed = createTaskCommentSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Comentario inválido.", "VALIDATION", 400);
    }

    const task = await prisma.task.findFirst({
      where: { id: parsed.data.taskId, deletedAt: null },
    });

    if (!task) {
      throw new AppError("Tarea no encontrada.", "NOT_FOUND", 404);
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: parsed.data.taskId,
        userId: user.id,
        content: parsed.data.content,
      },
      include: { user: { include: { profile: true } } },
    });

    return { success: true as const, data: comment };
  } catch (error) {
    return toActionError(error);
  }
}