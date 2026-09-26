"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { EventStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getSessionUser } from "@/lib/session";
import { createBandMember, type CreatedMember } from "@/lib/members";
import { generateUniqueInviteCode, normalizeInviteCode } from "@/lib/invite";
import { DEFAULT_BAND_NAME, getBand } from "@/lib/workspace";
import { onboardingSchema, registerSchema, updateBandSchema } from "@/lib/validations/band";

async function requireAdmin() {
  const user = await getSessionUser();
  if (user.role !== "ADMIN") {
    throw new AppError("Solo un administrador puede configurar la banda.", "FORBIDDEN", 403);
  }
  return user;
}

/** Sala a la que lleva un código de invitación (para mostrarla antes de unirse). */
export async function lookupInvite(code: string) {
  try {
    const band = await prisma.band.findUnique({
      where: { inviteCode: normalizeInviteCode(code) },
      select: { name: true, logoData: true, genre: true, city: true },
    });
    if (!band) {
      throw new AppError("Ese código no corresponde a ninguna sala.", "NOT_FOUND", 404);
    }
    return { success: true as const, data: band };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Registro. Con código de invitación te unes a esa sala como componente;
 * sin código se crea una sala nueva y quedas como administrador (después
 * pasa por el asistente).
 */
export async function registerAccount(input: unknown) {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }

    const { name, email, password, inviteCode, instrument } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Ya existe una cuenta con ese email. Inicia sesión.", "CONFLICT", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (inviteCode) {
      const band = await prisma.band.findUnique({
        where: { inviteCode: normalizeInviteCode(inviteCode) },
      });
      if (!band) {
        throw new AppError("Ese código no corresponde a ninguna sala.", "NOT_FOUND", 404);
      }
      await prisma.user.create({
        data: {
          bandId: band.id,
          email,
          passwordHash,
          role: UserRole.MEMBER,
          profile: { create: { name, instrument, joinedAt: new Date() } },
        },
      });
      return { success: true as const, data: { email, joined: true, bandName: band.name as string | null } };
    }

    await prisma.$transaction(async (tx) => {
      const band = await tx.band.create({
        data: {
          name: DEFAULT_BAND_NAME,
          inviteCode: await generateUniqueInviteCode(tx),
          hasStore: false,
        },
      });
      await tx.user.create({
        data: {
          bandId: band.id,
          email,
          passwordHash,
          role: UserRole.ADMIN,
          profile: { create: { name, instrument, joinedAt: new Date() } },
        },
      });
    });

    return { success: true as const, data: { email, joined: false, bandName: null as string | null } };
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
    const bandId = admin.bandId;
    const current = await getBand(bandId);
    if (!current) {
      throw new AppError("Sala no encontrada.", "NOT_FOUND", 404);
    }

    const created = await prisma.$transaction(async (tx) => {
      // Si la sala aún tenía el código genérico, se regenera con el nombre real
      const renamed = current.name !== data.name && !current.onboardedAt;
      await tx.band.update({
        where: { id: bandId },
        data: {
          name: data.name,
          logoData: data.logoData ?? current.logoData ?? null,
          genre: data.genre ?? null,
          city: data.city ?? null,
          foundedYear: data.foundedYear ?? null,
          bio: data.bio ?? null,
          hasStore: data.hasStore,
          storeUrl: data.hasStore ? (data.storeUrl ?? null) : null,
          links: data.links,
          onboardedAt: new Date(),
          ...(renamed ? { inviteCode: await generateUniqueInviteCode(tx, data.name) } : {}),
        },
      });

      if (data.myInstrument) {
        await tx.memberProfile.updateMany({
          where: { userId: admin.id },
          data: { instrument: data.myInstrument },
        });
      }

      const members: CreatedMember[] = [];
      for (const member of data.members) {
        members.push(await createBandMember(tx, { ...member, bandId }));
      }

      if (data.songTitles.length > 0) {
        const songs = [];
        for (const title of data.songTitles) {
          songs.push(await tx.song.create({ data: { bandId, title, artist: data.name } }));
        }
        await tx.repertoire.updateMany({ where: { bandId, isActive: true }, data: { isActive: false } });
        await tx.repertoire.create({
          data: {
            bandId,
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
            bandId,
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
            bandId,
            title: data.firstEvent.title,
            type: data.firstEvent.type,
            startAt: data.firstEvent.startAt,
            endAt,
            venue: data.firstEvent.venue,
            status: EventStatus.CONFIRMED,
          },
        });
      }

      const band = await tx.band.findUniqueOrThrow({ where: { id: bandId } });
      return { bandId, inviteCode: band.inviteCode, members };
    });

    revalidatePath("/", "layout");
    return { success: true as const, data: created };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateBand(input: unknown) {
  try {
    const admin = await requireAdmin();
    const parsed = updateBandSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }
    const { logoData, ...rest } = parsed.data;

    await prisma.band.update({
      where: { id: admin.bandId },
      data: {
        ...rest,
        genre: rest.genre ?? null,
        city: rest.city ?? null,
        foundedYear: rest.foundedYear ?? null,
        bio: rest.bio ?? null,
        storeUrl: rest.hasStore ? (rest.storeUrl ?? null) : null,
        // null borra el logo; undefined lo conserva
        ...(logoData === null ? { logoData: null } : logoData ? { logoData } : {}),
      },
    });

    revalidatePath("/", "layout");
    return { success: true as const, data: { id: admin.bandId } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Nuevo código de invitación: el anterior deja de funcionar al instante. */
export async function regenerateInviteCode() {
  try {
    const admin = await requireAdmin();
    const band = await getBand(admin.bandId);
    const inviteCode = await generateUniqueInviteCode(prisma, band?.name);
    await prisma.band.update({ where: { id: admin.bandId }, data: { inviteCode } });
    revalidatePath("/", "layout");
    return { success: true as const, data: { inviteCode } };
  } catch (error) {
    return toActionError(error);
  }
}
