"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validations";

export async function requestPasswordReset(input: unknown) {
  try {
    const parsed = requestPasswordResetSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Email inválido.", "VALIDATION", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    // Respuesta genérica para no revelar si el email existe.
    if (!user || !user.isActive || user.deletedAt) {
      return {
        success: true as const,
        data: {
          message:
            "Si el email existe en el sistema, recibirás instrucciones para restablecer la contraseña.",
        },
      };
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // Simulación: en producción se enviaría un email.
    const resetUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV === "development") {
      console.info(`[SIMULACIÓN] Enlace de restablecimiento: ${resetUrl}`);
    }

    return {
      success: true as const,
      data: {
        message:
          "Si el email existe en el sistema, recibirás instrucciones para restablecer la contraseña.",
        ...(process.env.NODE_ENV === "development" ? { resetUrl } : {}),
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPassword(input: unknown) {
  try {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos inválidos.", "VALIDATION", 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: parsed.data.token,
        resetTokenExp: { gt: new Date() },
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new AppError("Token inválido o expirado.", "INVALID_TOKEN", 400);
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return {
      success: true as const,
      data: {
        message: "Contraseña actualizada correctamente.",
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}