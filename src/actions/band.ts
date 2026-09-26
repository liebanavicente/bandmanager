"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { EventStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getSessionUser } from "@/lib/session";
import { createBandMember, type CreatedMember } from "@/lib/members";
import { getBand } from "@/lib/workspace";
import { onboardingSchema, registerSchema, updateBandSchema } from "@/lib/validations/band";

async function requireAdmin() {
  const user = await getSessionUser();
  if (user.role !== "ADMIN") {
    throw new AppError("Solo un administrador puede configurar la banda.", "FORBIDDEN", 403);
  }
  return user;
}

/**
 * El registro abierto solo existe mientras la banda no tenga administrador:
 * quien se registra primero crea la banda. El resto entra por invitación.
 */
export async function isRegistrationOpen() {
  const admins = await prisma.user.count({
    where: { role: UserRole.ADMIN, deletedAt: null },
  });
  return admins === 0;
}

export async function registerAccount(input: unknown) {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }
    if (!(await isRegistrationOpen())) {
      throw new AppError(
        "Esta banda ya tiene administrador. Pídele que te invite desde Miembros.",
        "REGISTRATION_CLOSED",
        403,
      );
    }

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Ya existe una cuenta con ese email.", "CONFLICT", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        profile: { create: { name, joinedAt: new Date() } },
      },
    });

    return { success: true as const, data: { email } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function completeOnboarding(input: unknown) {
  try {
    const admin = await requireAdmin();
    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }
    const data = parsed.data;
    const current = await getBand();

    const created = await prisma.$transaction(async (tx) => {
      const bandData = {
        name: data.name,
        logoData: data.logoData ?? current?.logoData ?? null,
        genre: data.genre ?? null,
        city: data.city ?? null,
        foundedYear: data.foundedYear ?? null,
        bio: data.bio ?? null,
        hasStore: data.hasStore,
        storeUrl: data.hasStore ? (data.storeUrl ?? null) : null,
        links: data.links,
        onboardedAt: new Date(),
      };
      const band = current
        ? await tx.band.update({ where: { id: current.id }, data: bandData })
        : await tx.band.create({ data: bandData });

      if (data.myInstrument) {
        await tx.memberProfile.updateMany({
          where: { userId: admin.id },
          data: { instrument: data.myInstrument },
        });
      }

      const members: CreatedMember[] = [];
      for (const member of data.members) {
        members.push(await createBandMember(tx, member));
      }

      if (data.songTitles.length > 0) {
        const songs = [];
        for (const title of data.songTitles) {
          songs.push(await tx.song.create({ data: { title, artist: data.name } }));
        }
        await tx.repertoire.updateMany({ where: { isActive: true }, data: { isActive: false } });
        await tx.repertoire.create({
          data: {
            name: "Repertorio principal",
            isActive: true,
            songs: {
              create: songs.map((song, position) => ({ songId: song.id, position })),
            },
          },
        });
      }

      if (data.hasStore && data.firstProduct) {
        await tx.product.create({
          data: {
            name: data.firstProduct.name,
            category: data.firstProduct.category,
            priceCents: Math.round(data.firstProduct.priceEuros * 100),
            costCents: 0,
            sku: `BM-${randomBytes(4).toString("hex").toUpperCase()}`,
          },
        });
      }

      if (data.firstEvent) {
        const endAt = new Date(data.firstEvent.startAt.getTime() + 2 * 60 * 60 * 1000);
        await tx.event.create({
          data: {
            title: data.firstEvent.title,
            type: data.firstEvent.type,
            startAt: data.firstEvent.startAt,
            endAt,
            venue: data.firstEvent.venue,
            status: EventStatus.CONFIRMED,
          },
        });
      }

      return { bandId: band.id, members };
    });

    revalidatePath("/", "layout");
    return { success: true as const, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateBand(input: unknown) {
  try {
    await requireAdmin();
    const parsed = updateBandSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }
    const { logoData, ...rest } = parsed.data;
    const data = {
      ...rest,
      genre: rest.genre ?? null,
      city: rest.city ?? null,
      foundedYear: rest.foundedYear ?? null,
      bio: rest.bio ?? null,
      storeUrl: rest.hasStore ? (rest.storeUrl ?? null) : null,
      // null borra el logo; undefined lo conserva
      ...(logoData === null ? { logoData: null } : logoData ? { logoData } : {}),
    };

    const current = await getBand();
    const band = current
      ? await prisma.band.update({ where: { id: current.id }, data })
      : await prisma.band.create({ data: { ...data, onboardedAt: new Date() } });

    revalidatePath("/", "layout");
    return { success: true as const, data: { id: band.id } };
  } catch (error) {
    return toActionError(error);
  }
}
