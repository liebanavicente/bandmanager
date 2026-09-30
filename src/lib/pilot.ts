import type { FeedbackKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Quién puede ver el panel del piloto: PILOT_ADMIN_EMAILS, separados por comas. */
export function isPilotAdmin(email: string): boolean {
  const admins = (process.env.PILOT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export type BandPilotMetrics = {
  id: string;
  name: string;
  city: string | null;
  createdAt: Date;
  lastSeenAt: Date | null;
  members: number;
  activeMembers: number;
  eventsThisWeek: number;
  eventsWithAttendance: number;
  setlists: number;
  setlistsThisWeek: number;
  practicedThisWeek: number;
  feedback: number;
};

/**
 * Métricas del documento del piloto, por banda: "esta semana" son los
 * últimos 7 días. Las consultas agrupan por banda para no hacer N+1.
 */
export async function getPilotMetrics(now = new Date()): Promise<BandPilotMetrics[]> {
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const activeUser = { deletedAt: null, isActive: true };

  const [bands, members, active, lastSeen, events, setlists, setlistsWeek, practiced, feedback] =
    await Promise.all([
      prisma.band.findMany({
        select: { id: true, name: true, city: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.groupBy({ by: ["bandId"], where: activeUser, _count: true }),
      prisma.user.groupBy({
        by: ["bandId"],
        where: { ...activeUser, lastSeenAt: { gte: weekAgo } },
        _count: true,
      }),
      prisma.user.groupBy({ by: ["bandId"], where: activeUser, _max: { lastSeenAt: true } }),
      prisma.event.findMany({
        where: { deletedAt: null, startAt: { gte: weekAgo, lte: now } },
        select: {
          bandId: true,
          _count: { select: { attendances: { where: { status: { not: "PENDING" } } } } },
        },
      }),
      prisma.setlist.groupBy({ by: ["bandId"], where: { deletedAt: null }, _count: true }),
      prisma.setlist.groupBy({
        by: ["bandId"],
        where: { deletedAt: null, createdAt: { gte: weekAgo } },
        _count: true,
      }),
      prisma.lyricsProgress.findMany({
        where: { lastPracticedAt: { gte: weekAgo } },
        select: { user: { select: { bandId: true } } },
      }),
      prisma.feedback.groupBy({ by: ["bandId"], _count: true }),
    ]);

  const countBy = (rows: { bandId: string; _count: number }[]) =>
    new Map(rows.map((r) => [r.bandId, r._count]));
  const membersBy = countBy(members);
  const activeBy = countBy(active);
  const setlistsBy = countBy(setlists);
  const setlistsWeekBy = countBy(setlistsWeek);
  const feedbackBy = countBy(feedback);
  const lastSeenBy = new Map(lastSeen.map((r) => [r.bandId, r._max.lastSeenAt]));

  const tally = (keys: string[]) => {
    const map = new Map<string, number>();
    for (const key of keys) map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  };
  const eventsBy = tally(events.map((e) => e.bandId));
  const eventsAnsweredBy = tally(events.filter((e) => e._count.attendances > 0).map((e) => e.bandId));
  const practicedBy = tally(practiced.map((p) => p.user.bandId));

  return bands.map((band) => ({
    ...band,
    lastSeenAt: lastSeenBy.get(band.id) ?? null,
    members: membersBy.get(band.id) ?? 0,
    activeMembers: activeBy.get(band.id) ?? 0,
    eventsThisWeek: eventsBy.get(band.id) ?? 0,
    eventsWithAttendance: eventsAnsweredBy.get(band.id) ?? 0,
    setlists: setlistsBy.get(band.id) ?? 0,
    setlistsThisWeek: setlistsWeekBy.get(band.id) ?? 0,
    practicedThisWeek: practicedBy.get(band.id) ?? 0,
    feedback: feedbackBy.get(band.id) ?? 0,
  }));
}

export async function getPilotFeedback(kind?: FeedbackKind) {
  return prisma.feedback.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      band: { select: { name: true } },
      user: { select: { email: true, profile: { select: { name: true } } } },
    },
  });
}
