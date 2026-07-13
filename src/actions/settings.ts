"use server";

import { revalidatePath } from "next/cache";
import type { SyncProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { toActionError } from "@/lib/errors";

export async function getSettings() {
  const user = await getSessionUser();

  const recentSyncs = await prisma.syncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    user,
    recentSyncs,
    integrations: {
      woocommerce: Boolean(process.env.WOOCOMMERCE_URL),
      gelato: Boolean(process.env.GELATO_API_KEY),
    },
  };
}

export async function triggerSync(provider: SyncProvider) {
  try {
    const user = await getSessionUser();
    if (user.role !== "ADMIN") {
      throw new Error("FORBIDDEN");
    }

    const log = await prisma.syncLog.create({
      data: {
        provider,
        action: "manual_sync",
        status: "SUCCESS",
        payload: { triggeredBy: user.id, simulated: true },
      },
    });

    revalidatePath("/settings");
    return { data: log };
  } catch (error) {
    return toActionError(error);
  }
}