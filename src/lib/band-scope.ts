import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";

type Db = PrismaClient | Prisma.TransactionClient;

type Scoped = "song" | "event" | "user" | "product" | "repertoire" | "task";

const labels: Record<Scoped, string> = {
  song: "Alguna canción",
  event: "El evento",
  user: "Alguna persona",
  product: "Algún producto",
  repertoire: "El repertorio",
  task: "La tarea",
};

/**
 * Comprueba que todos los ids referenciados pertenecen a la sala. Evita que
 * alguien vincule (o lea a través de un vínculo) datos de otra banda.
 */
export async function assertInBand(
  db: Db,
  kind: Scoped,
  ids: (string | null | undefined)[],
  bandId: string,
): Promise<void> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return;

  const where = { id: { in: unique }, bandId };
  let count: number;
  switch (kind) {
    case "song":
      count = await db.song.count({ where });
      break;
    case "event":
      count = await db.event.count({ where });
      break;
    case "user":
      count = await db.user.count({ where });
      break;
    case "product":
      count = await db.product.count({ where });
      break;
    case "repertoire":
      count = await db.repertoire.count({ where });
      break;
    case "task":
      count = await db.task.count({ where });
      break;
  }
  if (count !== unique.length) {
    throw new AppError(`${labels[kind]} no pertenece a esta sala.`, "FORBIDDEN", 403);
  }
}
