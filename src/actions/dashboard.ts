"use server";

import { prisma } from "@/lib/prisma";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { centsToEuros } from "@/lib/money";
import { getLowStockItems } from "@/lib/stock";

export async function getDashboardData() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "dashboard", areas);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    upcomingEvents,
    nextConcert,
    nextRehearsal,
    pendingTasksList,
    pendingTasksCount,
    recentOrders,
    recentFiles,
    activeProducts,
    activeRepertoire,
    pendingAttendances,
    songsReadyCount,
    eventsThisMonth,
    lastSetlist,
  ] = await Promise.all([
    prisma.event.findMany({
      where: {
        deletedAt: null,
        startAt: { gte: now },
        status: { in: ["DRAFT", "CONFIRMED"] },
      },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    prisma.event.findFirst({
      where: { deletedAt: null, type: "CONCERT", startAt: { gte: now }, status: "CONFIRMED" },
      orderBy: { startAt: "asc" },
    }),
    prisma.event.findFirst({
      where: { deletedAt: null, type: "REHEARSAL", startAt: { gte: now }, status: "CONFIRMED" },
      orderBy: { startAt: "asc" },
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        assigneeId: user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 5,
    }),
    prisma.task.count({
      where: {
        deletedAt: null,
        assigneeId: user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
    prisma.fileAsset.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { uploadedBy: { include: { profile: true } } },
    }),
    prisma.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: { variants: true },
    }),
    prisma.repertoire.findFirst({
      where: { deletedAt: null, isActive: true },
      include: {
        songs: {
          orderBy: { position: "asc" },
          include: { song: true },
        },
      },
    }),
    prisma.eventAttendance.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
        event: { deletedAt: null, startAt: { gte: now } },
      },
      include: { event: true },
      take: 5,
    }),
    prisma.song.count({ where: { deletedAt: null, status: "READY" } }),
    prisma.event.count({
      where: {
        deletedAt: null,
        startAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Solo lectura: último setlist actualizado, sin cambios de esquema
    prisma.setlist.findFirst({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        event: true,
        items: { orderBy: { position: "asc" } },
      },
    }),
  ]);

  const stockAlerts = activeProducts.flatMap((product) =>
    getLowStockItems(
      product.variants.map((variant) => ({
        name: `${product.name} - ${variant.name}`,
        stock: variant.stock,
        minStock: product.minStock,
      })),
    ).map((alert) => ({
      productId: product.id,
      name: alert.name,
      stock: alert.stock,
      minStock: alert.minStock,
    })),
  );

  return {
    user: { id: user.id, name: user.name, role: user.role },
    nextConcert,
    nextRehearsal,
    upcomingEvents,
    pendingTasks: pendingTasksList,
    pendingAttendances,
    recentOrders,
    recentFiles,
    activeRepertoire,
    lastSetlist,
    stockAlerts: stockAlerts.slice(0, 5),
    stats: {
      eventsThisMonth,
      songsReady: songsReadyCount,
      pendingTasks: pendingTasksCount,
      lowStockProducts: stockAlerts.length,
      recentRevenueFormatted: centsToEuros(
        recentOrders
          .filter((o) => o.paymentStatus === "PAID")
          .reduce((sum, o) => sum + o.totalCents, 0),
      ),
    },
  };
}
