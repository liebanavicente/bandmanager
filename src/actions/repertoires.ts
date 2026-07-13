"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import {
  createRepertoireSchema,
  duplicateRepertoireSchema,
  reorderRepertoireSongsSchema,
  setActiveRepertoireSchema,
  updateRepertoireSchema,
} from "@/lib/validations";

async function authorizeRepertoires() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "repertoires", areas);
  return user;
}

export async function listRepertoires() {
  try {
    await authorizeRepertoires();
    const items = await prisma.repertoire.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      include: {
        songs: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
        _count: { select: { setlists: true } },
      },
    });

    return { success: true as const, data: items };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getRepertoire(id: string) {
  try {
    await authorizeRepertoires();
    const repertoire = await prisma.repertoire.findFirst({
      where: { id, deletedAt: null },
      include: {
        songs: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
        setlists: { where: { deletedAt: null } },
      },
    });

    if (!repertoire) {
      throw new AppError("Repertorio no encontrado.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: repertoire };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createRepertoire(input: unknown) {
  try {
    await authorizeRepertoires();
    const parsed = createRepertoireSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del repertorio inválidos.", "VALIDATION", 400);
    }

    const { songIds, ...data } = parsed.data;
    const repertoire = await prisma.repertoire.create({
      data: {
        ...data,
        songs: {
          create: songIds.map((songId, index) => ({
            songId,
            position: index + 1,
          })),
        },
      },
      include: {
        songs: { orderBy: { position: "asc" }, include: { song: true } },
      },
    });

    return { success: true as const, data: repertoire };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateRepertoire(input: unknown) {
  try {
    await authorizeRepertoires();
    const parsed = updateRepertoireSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del repertorio inválidos.", "VALIDATION", 400);
    }

    const { id, songIds, ...data } = parsed.data;
    const existing = await prisma.repertoire.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Repertorio no encontrado.", "NOT_FOUND", 404);
    }

    const repertoire = await prisma.$transaction(async (tx) => {
      if (songIds) {
        await tx.repertoireSong.deleteMany({ where: { repertoireId: id } });
        await tx.repertoireSong.createMany({
          data: songIds.map((songId, index) => ({
            repertoireId: id,
            songId,
            position: index + 1,
          })),
        });
      }

      return tx.repertoire.update({
        where: { id },
        data,
        include: {
          songs: { orderBy: { position: "asc" }, include: { song: true } },
        },
      });
    });

    return { success: true as const, data: repertoire };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteRepertoire(id: string) {
  try {
    await authorizeRepertoires();
    const existing = await prisma.repertoire.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Repertorio no encontrado.", "NOT_FOUND", 404);
    }

    if (existing.isActive) {
      throw new AppError("No puedes eliminar el repertorio activo.", "FORBIDDEN", 403);
    }

    await prisma.repertoire.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderRepertoireSongs(input: unknown) {
  try {
    await authorizeRepertoires();
    const parsed = reorderRepertoireSongsSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de reordenación inválidos.", "VALIDATION", 400);
    }

    const { repertoireId, songIds } = parsed.data;
    const repertoire = await prisma.repertoire.findFirst({
      where: { id: repertoireId, deletedAt: null },
    });

    if (!repertoire) {
      throw new AppError("Repertorio no encontrado.", "NOT_FOUND", 404);
    }

    await prisma.$transaction(
      songIds.map((songId, index) =>
        prisma.repertoireSong.updateMany({
          where: { repertoireId, songId },
          data: { position: index + 1 },
        }),
      ),
    );

    const updated = await prisma.repertoire.findUnique({
      where: { id: repertoireId },
      include: {
        songs: { orderBy: { position: "asc" }, include: { song: true } },
      },
    });

    return { success: true as const, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}

export async function duplicateRepertoire(input: unknown) {
  try {
    await authorizeRepertoires();
    const parsed = duplicateRepertoireSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos inválidos.", "VALIDATION", 400);
    }

    const source = await prisma.repertoire.findFirst({
      where: { id: parsed.data.id, deletedAt: null },
      include: { songs: { orderBy: { position: "asc" } } },
    });

    if (!source) {
      throw new AppError("Repertorio no encontrado.", "NOT_FOUND", 404);
    }

    const duplicate = await prisma.repertoire.create({
      data: {
        name: parsed.data.name ?? `${source.name} (copia)`,
        description: source.description,
        notes: source.notes,
        isActive: false,
        songs: {
          create: source.songs.map((item) => ({
            songId: item.songId,
            position: item.position,
          })),
        },
      },
      include: {
        songs: { orderBy: { position: "asc" }, include: { song: true } },
      },
    });

    return { success: true as const, data: duplicate };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setActiveRepertoire(input: unknown) {
  try {
    await authorizeRepertoires();
    const parsed = setActiveRepertoireSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos inválidos.", "VALIDATION", 400);
    }

    const repertoire = await prisma.repertoire.findFirst({
      where: { id: parsed.data.id, deletedAt: null },
    });

    if (!repertoire) {
      throw new AppError("Repertorio no encontrado.", "NOT_FOUND", 404);
    }

    await prisma.$transaction([
      prisma.repertoire.updateMany({
        where: { deletedAt: null, isActive: true },
        data: { isActive: false },
      }),
      prisma.repertoire.update({
        where: { id: parsed.data.id },
        data: { isActive: true, isArchived: false },
      }),
    ]);

    const updated = await prisma.repertoire.findUnique({
      where: { id: parsed.data.id },
      include: {
        songs: { orderBy: { position: "asc" }, include: { song: true } },
      },
    });

    return { success: true as const, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}