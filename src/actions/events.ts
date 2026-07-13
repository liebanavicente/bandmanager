"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { generateEventIcs } from "@/lib/ics";
import {
  createEventSchema,
  eventFiltersSchema,
  updateAttendanceSchema,
  updateEventSchema,
} from "@/lib/validations";

async function authorizeEvents() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "events", areas);
  return user;
}

export async function listEvents(input: unknown = {}) {
  try {
    await authorizeEvents();
    const parsed = eventFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, type, status, from, to } = parsed.data;
    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { venue: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            startAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startAt: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          attendances: {
            include: {
              user: { include: { profile: true } },
            },
          },
          _count: { select: { setlists: true, tasks: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { success: true as const, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getEvent(id: string) {
  try {
    await authorizeEvents();
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        attendances: {
          include: { user: { include: { profile: true } } },
        },
        setlists: {
          where: { deletedAt: null },
          include: { items: { include: { song: true }, orderBy: { position: "asc" } } },
        },
        tasks: { where: { deletedAt: null } },
        fileAssets: { where: { deletedAt: null } },
      },
    });

    if (!event) {
      throw new AppError("Evento no encontrado.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: event };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createEvent(input: unknown) {
  try {
    await authorizeEvents();
    const parsed = createEventSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del evento inválidos.", "VALIDATION", 400);
    }

    const event = await prisma.event.create({ data: parsed.data });
    return { success: true as const, data: event };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateEvent(input: unknown) {
  try {
    await authorizeEvents();
    const parsed = updateEventSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del evento inválidos.", "VALIDATION", 400);
    }

    const { id, ...data } = parsed.data;
    const existing = await prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Evento no encontrado.", "NOT_FOUND", 404);
    }

    const event = await prisma.event.update({ where: { id }, data });
    return { success: true as const, data: event };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteEvent(id: string) {
  try {
    await authorizeEvents();
    const existing = await prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Evento no encontrado.", "NOT_FOUND", 404);
    }

    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateEventAttendance(input: unknown) {
  try {
    const user = await authorizeEvents();
    const parsed = updateAttendanceSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de asistencia inválidos.", "VALIDATION", 400);
    }

    const { eventId, userId, status, note } = parsed.data;
    const event = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
    if (!event) {
      throw new AppError("Evento no encontrado.", "NOT_FOUND", 404);
    }

    if (user.role !== "ADMIN" && userId !== user.id) {
      throw new AppError("Solo puedes actualizar tu propia asistencia.", "FORBIDDEN", 403);
    }

    const attendance = await prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status, note },
      update: { status, note },
      include: { user: { include: { profile: true } } },
    });

    return { success: true as const, data: attendance };
  } catch (error) {
    return toActionError(error);
  }
}

export async function exportEventIcs(id: string) {
  try {
    await authorizeEvents();
    const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });
    if (!event) {
      throw new AppError("Evento no encontrado.", "NOT_FOUND", 404);
    }

    const ics = generateEventIcs(event);
    return { success: true as const, data: { ics, filename: `${event.title}.ics` } };
  } catch (error) {
    return toActionError(error);
  }
}