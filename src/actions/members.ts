"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { memberFiltersSchema, updateMemberSchema } from "@/lib/validations";
import { onboardingMemberSchema } from "@/lib/validations/band";
import { createBandMember } from "@/lib/members";

async function authorizeMembers() {
  const user = await getSessionUser();
  requirePermission(user.role, "members");
  return user;
}

export async function listMembers(input: unknown = {}) {
  try {
    const user = await authorizeMembers();
    const parsed = memberFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, role, isActive } = parsed.data;
    const where = {
      bandId: user.bandId,
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" as const } },
              {
                profile: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { profile: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { success: true as const, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getMember(id: string) {
  try {
    const user = await authorizeMembers();
    const member = await prisma.user.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
      include: { profile: true },
    });

    if (!member) {
      throw new AppError("Miembro no encontrado.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: member };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateMember(input: unknown) {
  try {
    const user = await authorizeMembers();
    const parsed = updateMemberSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del miembro inválidos.", "VALIDATION", 400);
    }

    const { id, role, links, ...profileData } = parsed.data;
    const existing = await prisma.user.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
      include: { profile: true },
    });

    if (!existing) {
      throw new AppError("Miembro no encontrado.", "NOT_FOUND", 404);
    }

    if (role && user.role !== "ADMIN") {
      throw new AppError("Solo un administrador puede cambiar el rol.", "FORBIDDEN", 403);
    }

    // Una sala nunca se queda sin administrador
    if (role && existing.role === "ADMIN" && role !== "ADMIN") {
      const admins = await prisma.user.count({
        where: { bandId: user.bandId, role: "ADMIN", deletedAt: null, isActive: true },
      });
      if (admins <= 1) {
        throw new AppError("La sala necesita al menos un administrador.", "VALIDATION", 400);
      }
    }

    const member = await prisma.$transaction(async (tx) => {
      if (Object.keys(profileData).length > 0 || links !== undefined) {
        if (existing.profile) {
          await tx.memberProfile.update({
            where: { userId: id },
            data: {
              ...profileData,
              ...(links !== undefined ? { links } : {}),
            },
          });
        } else {
          await tx.memberProfile.create({
            data: {
              userId: id,
              name: profileData.name ?? existing.email,
              ...profileData,
              ...(links !== undefined ? { links } : {}),
            },
          });
        }
      }

      if (role) {
        await tx.user.update({ where: { id }, data: { role } });
      }

      return tx.user.findUnique({
        where: { id },
        include: { profile: true },
      });
    });

    return { success: true as const, data: member };
  } catch (error) {
    return toActionError(error);
  }
}

export async function activateMember(id: string) {
  try {
    const user = await authorizeMembers();
    if (user.role !== "ADMIN") {
      throw new AppError("Solo un administrador puede activar miembros.", "FORBIDDEN", 403);
    }

    const existing = await prisma.user.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
    if (!existing) {
      throw new AppError("Miembro no encontrado.", "NOT_FOUND", 404);
    }

    const member = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      include: { profile: true },
    });

    return { success: true as const, data: member };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deactivateMember(id: string) {
  try {
    const user = await authorizeMembers();
    if (user.role !== "ADMIN") {
      throw new AppError("Solo un administrador puede desactivar miembros.", "FORBIDDEN", 403);
    }

    if (user.id === id) {
      throw new AppError("No puedes desactivar tu propia cuenta.", "FORBIDDEN", 403);
    }

    const existing = await prisma.user.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
    if (!existing) {
      throw new AppError("Miembro no encontrado.", "NOT_FOUND", 404);
    }

    const member = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: { profile: true },
    });

    return { success: true as const, data: member };
  } catch (error) {
    return toActionError(error);
  }
}
export async function createMember(input: unknown) {
  try {
    const user = await authorizeMembers();
    if (user.role !== "ADMIN") {
      throw new AppError("Solo un administrador puede añadir componentes.", "FORBIDDEN", 403);
    }

    const parsed = onboardingMemberSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }

    const created = await prisma.$transaction((tx) => createBandMember(tx, { ...parsed.data, bandId: user.bandId }));
    return { success: true as const, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

/** Baja de un componente: desaparece de la banda y pierde el acceso. */
export async function removeMember(id: string) {
  try {
    const user = await authorizeMembers();
    if (user.role !== "ADMIN") {
      throw new AppError("Solo un administrador puede eliminar componentes.", "FORBIDDEN", 403);
    }
    if (user.id === id) {
      throw new AppError("No puedes eliminar tu propia cuenta.", "FORBIDDEN", 403);
    }

    const existing = await prisma.user.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
    if (!existing) {
      throw new AppError("Miembro no encontrado.", "NOT_FOUND", 404);
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}
