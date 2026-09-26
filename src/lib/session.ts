import { cache } from "react";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Sala (banda) a la que pertenece: todo lo que ve y edita cuelga de aquí. */
  bandId: string;
};

/**
 * Usuario de la petición, leído de la base de datos (no solo del token):
 * así una baja, un cambio de rol o de sala se aplican al instante. Se
 * memoiza por petición.
 */
export const getSessionUser = cache(async (): Promise<SessionUser> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Debes iniciar sesión.", "UNAUTHORIZED", 401);
  }
  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null, isActive: true },
    include: { profile: true },
  });
  if (!user) {
    throw new AppError("Tu acceso a esta sala ya no está activo.", "UNAUTHORIZED", 401);
  }
  return {
    id: user.id,
    email: user.email,
    name: user.profile?.name ?? user.email,
    role: user.role,
    bandId: user.bandId,
  };
});

/** Igual que getSessionUser pero devuelve null en vez de lanzar. */
export async function getOptionalSessionUser(): Promise<SessionUser | null> {
  try {
    return await getSessionUser();
  } catch {
    return null;
  }
}

export async function getCollaboratorAreas(userId: string): Promise<string[]> {
  const access = await prisma.collaboratorAccess.findUnique({
    where: { userId },
  });
  return access?.areas ?? ["events", "setlists", "tasks", "files"];
}
