"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import {
  isDue,
  modeWeight,
  nextMastery,
  nextReviewDate,
  reviewPriority,
  type PracticeMode,
} from "@/lib/lyrics/practice";

type WeakLines = Record<string, { miss: number; hit: number }>;

async function authorizePractice() {
  const user = await getSessionUser();
  const areas = user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "songs", areas);
  return user;
}

/** Canción con su letra y lo que el usuario ya lleva practicado. */
export async function getPracticeSong(songId: string) {
  try {
    const user = await authorizePractice();
    const song = await prisma.song.findFirst({
      where: { id: songId, bandId: user.bandId, deletedAt: null },
      select: {
        id: true,
        title: true,
        artist: true,
        keySignature: true,
        lyrics: true,
        lyricsProgress: { where: { userId: user.id }, take: 1 },
      },
    });
    if (!song) throw new AppError("Canción no encontrada.", "NOT_FOUND", 404);
    const { lyricsProgress, ...rest } = song;
    const progress = lyricsProgress[0] ?? null;
    return {
      success: true as const,
      data: {
        ...rest,
        progress: progress
          ? {
              mastery: progress.mastery,
              attempts: progress.attempts,
              lastScore: progress.lastScore,
              lastPracticedAt: progress.lastPracticedAt,
              nextReviewAt: progress.nextReviewAt,
              weakLines: (progress.weakLines as WeakLines | null) ?? {},
            }
          : null,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

const recordPracticeSchema = z.object({
  songId: z.string().cuid(),
  mode: z.enum(["gaps", "initials", "memory"]),
  gapRatio: z.number().min(0).max(1).optional(),
  lines: z
    .array(z.object({ key: z.string().max(500), score: z.number().min(0).max(1) }))
    .min(1)
    .max(500),
});

/** Guarda una práctica: actualiza dominio, próximo repaso y versos flojos. */
export async function recordPractice(input: unknown) {
  try {
    const user = await authorizePractice();
    const parsed = recordPracticeSchema.safeParse(input);
    if (!parsed.success) throw new AppError("Datos de práctica inválidos.", "VALIDATION", 400);
    const { songId, mode, gapRatio, lines } = parsed.data;

    const song = await prisma.song.findFirst({ where: { id: songId, bandId: user.bandId, deletedAt: null } });
    if (!song) throw new AppError("Canción no encontrada.", "NOT_FOUND", 404);

    const score = lines.reduce((sum, l) => sum + l.score, 0) / lines.length;
    const effective = score * modeWeight(mode as PracticeMode, gapRatio);
    const now = new Date();

    const previous = await prisma.lyricsProgress.findUnique({ where: { userId_songId: { userId: user.id, songId } } });
    const mastery = nextMastery(previous?.mastery ?? null, previous?.attempts ?? 0, effective);

    const weak: WeakLines = { ...((previous?.weakLines as WeakLines | null) ?? {}) };
    for (const line of lines) {
      if (!line.key) continue;
      const entry = weak[line.key] ?? { miss: 0, hit: 0 };
      if (line.score >= 0.9) entry.hit += 1;
      else entry.miss += 1;
      weak[line.key] = entry;
    }
    // Un verso que ya se acierta de forma repetida deja de contar como flojo
    for (const [key, entry] of Object.entries(weak)) {
      if (entry.hit >= entry.miss + 3) delete weak[key];
    }

    const data = {
      mastery,
      lastScore: Math.round(score * 100),
      lastMode: mode,
      lastPracticedAt: now,
      nextReviewAt: nextReviewDate(mastery, now),
      weakLines: weak as Prisma.InputJsonValue,
    };
    const progress = await prisma.lyricsProgress.upsert({
      where: { userId_songId: { userId: user.id, songId } },
      create: { userId: user.id, songId, attempts: 1, ...data },
      update: { attempts: { increment: 1 }, ...data },
    });

    return {
      success: true as const,
      data: {
        score: Math.round(score * 100),
        mastery: progress.mastery,
        previousMastery: previous?.mastery ?? null,
        nextReviewAt: progress.nextReviewAt,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

const DAY = 24 * 60 * 60 * 1000;

/** Canciones con letra ordenadas por lo que toca repasar, con el próximo bolo. */
export async function getReviewQueue() {
  try {
    const user = await authorizePractice();
    const now = new Date();
    const horizon = new Date(now.getTime() + 30 * DAY);

    const [songs, events] = await Promise.all([
      prisma.song.findMany({
        where: { bandId: user.bandId, deletedAt: null, status: { not: "ARCHIVED" }, lyrics: { not: null } },
        select: {
          id: true,
          title: true,
          keySignature: true,
          lyrics: true,
          lyricsProgress: { where: { userId: user.id }, take: 1 },
        },
        orderBy: { title: "asc" },
      }),
      prisma.event.findMany({
        where: {
          bandId: user.bandId,
          deletedAt: null,
          status: { not: "CANCELLED" },
          startAt: { gte: now, lte: horizon },
          setlists: { some: { deletedAt: null } },
        },
        orderBy: { startAt: "asc" },
        select: {
          id: true,
          title: true,
          startAt: true,
          venue: true,
          setlists: {
            where: { deletedAt: null },
            select: { items: { where: { type: "SONG" }, orderBy: { position: "asc" }, select: { songId: true } } },
          },
        },
      }),
    ]);

    // Primer bolo (el más cercano) en el que suena cada canción
    const gigBySong = new Map<string, { id: string; title: string; startAt: Date; venue: string | null }>();
    for (const event of events) {
      for (const setlist of event.setlists) {
        for (const item of setlist.items) {
          if (item.songId && !gigBySong.has(item.songId)) {
            gigBySong.set(item.songId, { id: event.id, title: event.title, startAt: event.startAt, venue: event.venue });
          }
        }
      }
    }

    const items = songs
      .filter((song) => song.lyrics?.trim())
      .map((song) => {
        const progress = song.lyricsProgress[0] ?? null;
        const gig = gigBySong.get(song.id) ?? null;
        const candidate = {
          songId: song.id,
          mastery: progress ? progress.mastery : null,
          nextReviewAt: progress?.nextReviewAt ?? null,
          daysToGig: gig ? Math.max(0, Math.floor((gig.startAt.getTime() - now.getTime()) / DAY)) : null,
        };
        const weakLines = (progress?.weakLines as WeakLines | null) ?? {};
        return {
          id: song.id,
          title: song.title,
          keySignature: song.keySignature,
          mastery: candidate.mastery,
          attempts: progress?.attempts ?? 0,
          lastPracticedAt: progress?.lastPracticedAt ?? null,
          nextReviewAt: candidate.nextReviewAt,
          weakCount: Object.values(weakLines).filter((w) => w.miss > w.hit).length,
          gig,
          due: isDue(candidate, now),
          priority: reviewPriority(candidate, now),
        };
      })
      .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title, "es"));

    const nextGig = events[0]
      ? {
          id: events[0].id,
          title: events[0].title,
          startAt: events[0].startAt,
          venue: events[0].venue,
          songIds: [...new Set(events[0].setlists.flatMap((s) => s.items.map((i) => i.songId)).filter(Boolean))] as string[],
        }
      : null;

    return { success: true as const, data: { items, nextGig } };
  } catch (error) {
    return toActionError(error);
  }
}
