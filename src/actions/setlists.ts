"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { formatDuration, sumDurations } from "@/lib/duration";
import {
  createSetlistSchema,
  duplicateSetlistSchema,
  reorderSetlistItemsSchema,
  updateSetlistSchema,
} from "@/lib/validations";

async function authorizeSetlists() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "setlists", areas);
  return user;
}

export async function listSetlists(eventId?: string) {
  try {
    await authorizeSetlists();
    const items = await prisma.setlist.findMany({
      where: {
        deletedAt: null,
        ...(eventId ? { eventId } : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        event: true,
        repertoire: true,
        _count: { select: { items: true } },
      },
    });

    return { success: true as const, data: items };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getSetlist(id: string) {
  try {
    await authorizeSetlists();
    const setlist = await prisma.setlist.findFirst({
      where: { id, deletedAt: null },
      include: {
        event: true,
        repertoire: true,
        items: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
      },
    });

    if (!setlist) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: setlist };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createSetlist(input: unknown) {
  try {
    await authorizeSetlists();
    const parsed = createSetlistSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la setlist inválidos.", "VALIDATION", 400);
    }

    const { items, ...data } = parsed.data;
    const setlist = await prisma.setlist.create({
      data: {
        ...data,
        items: {
          create: items.map((item, index) => ({
            type: item.type,
            songId: item.songId,
            comment: item.comment,
            position: index + 1,
          })),
        },
      },
      include: {
        items: { orderBy: { position: "asc" }, include: { song: true } },
      },
    });

    return { success: true as const, data: setlist };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateSetlist(input: unknown) {
  try {
    await authorizeSetlists();
    const parsed = updateSetlistSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la setlist inválidos.", "VALIDATION", 400);
    }

    const { id, items, ...data } = parsed.data;
    const existing = await prisma.setlist.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    const setlist = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.setlistItem.deleteMany({ where: { setlistId: id } });
        await tx.setlistItem.createMany({
          data: items.map((item, index) => ({
            setlistId: id,
            type: item.type,
            songId: item.songId,
            comment: item.comment,
            position: index + 1,
          })),
        });
      }

      return tx.setlist.update({
        where: { id },
        data,
        include: {
          items: { orderBy: { position: "asc" }, include: { song: true } },
        },
      });
    });

    return { success: true as const, data: setlist };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteSetlist(id: string) {
  try {
    await authorizeSetlists();
    const existing = await prisma.setlist.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    await prisma.setlist.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderSetlistItems(input: unknown) {
  try {
    await authorizeSetlists();
    const parsed = reorderSetlistItemsSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de reordenación inválidos.", "VALIDATION", 400);
    }

    const { setlistId, itemIds } = parsed.data;
    const setlist = await prisma.setlist.findFirst({
      where: { id: setlistId, deletedAt: null },
    });

    if (!setlist) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    await prisma.$transaction(
      itemIds.map((itemId, index) =>
        prisma.setlistItem.updateMany({
          where: { setlistId, id: itemId },
          data: { position: index + 1 },
        }),
      ),
    );

    const updated = await prisma.setlist.findUnique({
      where: { id: setlistId },
      include: {
        items: { orderBy: { position: "asc" }, include: { song: true } },
      },
    });

    return { success: true as const, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function duplicateSetlist(input: unknown) {
  try {
    await authorizeSetlists();
    const parsed = duplicateSetlistSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos inválidos.", "VALIDATION", 400);
    }

    const source = await prisma.setlist.findFirst({
      where: { id: parsed.data.id, deletedAt: null },
      include: { items: { orderBy: { position: "asc" } } },
    });

    if (!source) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    const duplicate = await prisma.setlist.create({
      data: {
        name: parsed.data.name ?? `${source.name} (copia)`,
        eventId: source.eventId,
        repertoireId: source.repertoireId,
        notes: source.notes,
        items: {
          create: source.items.map((item) => ({
            type: item.type,
            songId: item.songId,
            comment: item.comment,
            position: item.position,
          })),
        },
      },
      include: {
        items: { orderBy: { position: "asc" }, include: { song: true } },
      },
    });

    return { success: true as const, data: duplicate };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getSetlistStageView(id: string) {
  try {
    await authorizeSetlists();
    const setlist = await prisma.setlist.findFirst({
      where: { id, deletedAt: null },
      include: {
        event: true,
        items: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
      },
    });

    if (!setlist) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    const songDurations = setlist.items
      .filter((item) => item.type === "SONG" && item.song)
      .map((item) => item.song?.durationSeconds);

    const totalSeconds = sumDurations(songDurations);

    const stageItems = setlist.items.map((item, index) => ({
      position: index + 1,
      type: item.type,
      comment: item.comment,
      song: item.song
        ? {
            id: item.song.id,
            title: item.song.title,
            artist: item.song.artist,
            keySignature: item.song.keySignature,
            tempo: item.song.tempo,
            timeSignature: item.song.timeSignature,
            leadVocal: item.song.leadVocal,
            duration: formatDuration(item.song.durationSeconds),
            technicalNotes: item.song.technicalNotes,
          }
        : null,
    }));

    return {
      success: true as const,
      data: {
        id: setlist.id,
        name: setlist.name,
        event: setlist.event,
        notes: setlist.notes,
        totalDuration: formatDuration(totalSeconds),
        totalSeconds,
        items: stageItems,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}