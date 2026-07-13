import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AppError("Debes iniciar sesión.", "UNAUTHORIZED", 401);
  }
  return session.user;
}

export async function getCollaboratorAreas(userId: string): Promise<string[]> {
  const access = await prisma.collaboratorAccess.findUnique({
    where: { userId },
  });
  return access?.areas ?? ["events", "setlists", "tasks", "files"];
}