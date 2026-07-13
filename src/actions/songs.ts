"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import {
  createSongSchema,
  songFiltersSchema,
  updateSongSchema,
} from "@/lib/validations";

async function authorizeSongs() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "songs", areas);
  return user;
}

export async function listSongs(input: unknown = {}) {
  try {
    await authorizeSongs();
    const parsed = songFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, status, artist, tag } = parsed.data;
    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { artist: { contains: search, mode: "insensitive" as const } },
              { composer: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(artist ? { artist: { contains: artist, mode: "insensitive" as const } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.song.findMany({
        where,
        orderBy: { title: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.song.count({ where }),
    ]);

    return { success: true as const, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getSong(id: string) {
  try {
    await authorizeSongs();
    const song = await prisma.song.findFirst({
      where: { id, deletedAt: null },
      include: {
        repertoireSongs: {
          include: { repertoire: true },
        },
      },
    });

    if (!song) {
      throw new AppError("Canción no encontrada.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: song };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createSong(input: unknown) {
  try {
    await authorizeSongs();
    const parsed = createSongSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la canción inválidos.", "VALIDATION", 400);
    }

    const song = await prisma.song.create({ data: parsed.data });
    return { success: true as const, data: song };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateSong(input: unknown) {
  try {
    await authorizeSongs();
    const parsed = updateSongSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la canción inválidos.", "VALIDATION", 400);
    }

    const { id, ...data } = parsed.data;
    const existing = await prisma.song.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Canción no encontrada.", "NOT_FOUND", 404);
    }

    const song = await prisma.song.update({ where: { id }, data });
    return { success: true as const, data: song };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteSong(id: string) {
  try {
    await authorizeSongs();
    const existing = await prisma.song.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Canción no encontrada.", "NOT_FOUND", 404);
    }

    await prisma.song.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}