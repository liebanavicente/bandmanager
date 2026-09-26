"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import {
  createSongSchema,
  importLyricsSchema,
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
    const user = await authorizeSongs();
    const parsed = songFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, status, artist, tag } = parsed.data;
    const where = {
      bandId: user.bandId,
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
    const user = await authorizeSongs();
    const song = await prisma.song.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
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
    const user = await authorizeSongs();
    const parsed = createSongSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la canción inválidos.", "VALIDATION", 400);
    }

    const song = await prisma.song.create({ data: { ...parsed.data, bandId: user.bandId } });
    return { success: true as const, data: song };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateSong(input: unknown) {
  try {
    const user = await authorizeSongs();
    const parsed = updateSongSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de la canción inválidos.", "VALIDATION", 400);
    }

    const { id, ...data } = parsed.data;
    const existing = await prisma.song.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
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
    const user = await authorizeSongs();
    const existing = await prisma.song.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
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
/** Catálogo mínimo para emparejar letras importadas con canciones. */
export async function listSongsForImport() {
  try {
    const user = await authorizeSongs();
    const songs = await prisma.song.findMany({
      where: { bandId: user.bandId, deletedAt: null },
      orderBy: { title: "asc" },
      select: { id: true, title: true, keySignature: true, tempo: true, lyrics: true },
    });
    return {
      success: true as const,
      data: songs.map(({ lyrics, ...song }) => ({ ...song, hasLyrics: Boolean(lyrics?.trim()) })),
    };
  } catch (error) {
    return toActionError(error);
  }
}

/** Guarda letras importadas (y su tonalidad) de una vez. */
export async function importLyrics(input: unknown) {
  try {
    const user = await authorizeSongs();
    const parsed = importLyricsSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }
    const { items } = parsed.data;

    const ids = items.flatMap((item) => (item.songId ? [item.songId] : []));
    if (new Set(ids).size !== ids.length) {
      throw new AppError("Hay dos letras asignadas a la misma canción.", "VALIDATION", 400);
    }
    const owned = await prisma.song.count({ where: { id: { in: ids }, bandId: user.bandId, deletedAt: null } });
    if (owned !== ids.length) {
      throw new AppError("Alguna canción no existe en tu sala.", "NOT_FOUND", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      let updated = 0;
      let created = 0;
      for (const item of items) {
        const data = {
          lyrics: item.lyrics,
          ...(item.chords ? { chords: item.chords } : {}),
          ...(item.keySignature ? { keySignature: item.keySignature } : {}),
          ...(item.tempo ? { tempo: item.tempo } : {}),
        };
        if (item.songId) {
          await tx.song.update({ where: { id: item.songId }, data });
          updated += 1;
        } else {
          await tx.song.create({ data: { ...data, title: item.newTitle!, bandId: user.bandId } });
          created += 1;
        }
      }
      return { updated, created };
    });

    return { success: true as const, data: result };
  } catch (error) {
    return toActionError(error);
  }
}
