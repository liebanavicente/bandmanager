"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { assertInBand } from "@/lib/band-scope";
import { formatDuration, setlistSeconds } from "@/lib/duration";
import {
  createSetlistSchema,
  duplicateSetlistSchema,
  reorderSetlistItemsSchema,
  updateSetlistSchema,
  type CreateSetlistInput,
} from "@/lib/validations";

async function authorizeSetlists() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "setlists", areas);
  return user;
}

/** Una pista del formulario lista para guardar (la duración solo vale en pausas y notas). */
function toItemData(item: CreateSetlistInput["items"][number]) {
  const isSong = item.type === "SONG";
  return {
    type: item.type,
    songId: isSong ? item.songId : null,
    comment: item.comment,
    durationSeconds: isSong ? null : (item.durationSeconds ?? null),
  };
}

export async function listSetlists(eventId?: string) {
  try {
    const user = await authorizeSetlists();
    const items = await prisma.setlist.findMany({
      where: {
        bandId: user.bandId,
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
    const user = await authorizeSetlists();
    const setlist = await prisma.setlist.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
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
    const user = await authorizeSetlists();
    const parsed = createSetlistSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la setlist inválidos.", "VALIDATION", 400);
    }

    const { items, ...data } = parsed.data;
    await assertInBand(prisma, "song", items.map((item) => item.songId), user.bandId);
    await assertInBand(prisma, "event", [data.eventId], user.bandId);
    await assertInBand(prisma, "repertoire", [data.repertoireId], user.bandId);
    const setlist = await prisma.setlist.create({
      data: {
        ...data,
        bandId: user.bandId,
        items: {
          create: items.map((item, index) => ({ ...toItemData(item), position: index + 1 })),
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
    const user = await authorizeSetlists();
    const parsed = updateSetlistSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la setlist inválidos.", "VALIDATION", 400);
    }

    const { id, items, ...data } = parsed.data;
    const existing = await prisma.setlist.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
    if (!existing) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    await assertInBand(prisma, "song", (items ?? []).map((item) => item.songId), user.bandId);
    await assertInBand(prisma, "event", [data.eventId], user.bandId);
    await assertInBand(prisma, "repertoire", [data.repertoireId], user.bandId);

    const setlist = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.setlistItem.deleteMany({ where: { setlistId: id } });
        await tx.setlistItem.createMany({
          data: items.map((item, index) => ({ ...toItemData(item), setlistId: id, position: index + 1 })),
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
    const user = await authorizeSetlists();
    const existing = await prisma.setlist.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
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
    const user = await authorizeSetlists();
    const parsed = reorderSetlistItemsSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de reordenación inválidos.", "VALIDATION", 400);
    }

    const { setlistId, itemIds } = parsed.data;
    const setlist = await prisma.setlist.findFirst({
      where: { id: setlistId, bandId: user.bandId, deletedAt: null },
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
    const user = await authorizeSetlists();
    const parsed = duplicateSetlistSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos inválidos.", "VALIDATION", 400);
    }

    const source = await prisma.setlist.findFirst({
      where: { id: parsed.data.id, bandId: user.bandId, deletedAt: null },
      include: { items: { orderBy: { position: "asc" } } },
    });

    if (!source) {
      throw new AppError("Setlist no encontrada.", "NOT_FOUND", 404);
    }

    const duplicate = await prisma.setlist.create({
      data: {
        bandId: user.bandId,
        name: parsed.data.name ?? `${source.name} (copia)`,
        eventId: source.eventId,
        repertoireId: source.repertoireId,
        notes: source.notes,
        items: {
          create: source.items.map((item) => ({
            type: item.type,
            songId: item.songId,
            comment: item.comment,
            durationSeconds: item.durationSeconds,
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
    const user = await authorizeSetlists();
    const setlist = await prisma.setlist.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
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

    const totalSeconds = setlistSeconds(setlist.items);

    const stageItems = setlist.items.map((item, index) => ({
      position: index + 1,
      type: item.type,
      comment: item.comment,
      duration: item.type === "SONG" ? null : formatDuration(item.durationSeconds),
      song: item.song
        ? {
            id: item.song.id,
            title: item.song.title,
            artist: item.song.artist,
            keySignature: item.song.keySignature,
            tempo: item.song.tempo,
            timeSignature: item.song.timeSignature,
            tuning: item.song.tuning,
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
/** Canciones y eventos disponibles para montar un setlist. */
export async function listSetlistChoices() {
  try {
    const user = await authorizeSetlists();
    const [songs, events, repertoires] = await Promise.all([
      prisma.song.findMany({
        where: { bandId: user.bandId, deletedAt: null, status: { not: "ARCHIVED" } },
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          artist: true,
          durationSeconds: true,
          tuning: true,
          keySignature: true,
          tempo: true,
        },
      }),
      prisma.event.findMany({
        where: { bandId: user.bandId, deletedAt: null },
        orderBy: { startAt: "desc" },
        take: 50,
        select: { id: true, title: true, startAt: true },
      }),
      prisma.repertoire.findMany({
        where: { bandId: user.bandId, deletedAt: null, isArchived: false },
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          name: true,
          isActive: true,
          songs: { orderBy: { position: "asc" }, select: { songId: true } },
        },
      }),
    ]);
    return {
      success: true as const,
      data: {
        songs,
        events,
        repertoires: repertoires.map(({ songs: entries, ...repertoire }) => ({
          ...repertoire,
          songIds: entries.map((entry) => entry.songId),
        })),
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}
