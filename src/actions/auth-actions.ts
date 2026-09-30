"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { appUrl, sendMail } from "@/lib/mail";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "@/lib/validations";

const GENERIC_RESET_MESSAGE =
  "Si el email existe en el sistema, recibirás instrucciones para restablecer la contraseña.";

/** En la base de datos solo se guarda el hash: un volcado no sirve para entrar. */
function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function logout() {
  await signOut({ redirectTo: "/presentacion" });
}

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
      return { success: true as const, data: { message: GENERIC_RESET_MESSAGE } };
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashResetToken(resetToken), resetTokenExp },
    });

    const resetUrl = appUrl(`/reset-password?token=${resetToken}`);
    await sendMail({
      to: user.email,
      subject: "Restablece tu contraseña de BandManager",
      text: [
        "Hola:",
        "",
        "Has pedido restablecer tu contraseña de BandManager. Abre este enlace para elegir una nueva:",
        "",
        resetUrl,
        "",
        "El enlace caduca en 1 hora. Si no lo has pedido tú, ignora este email: tu contraseña no cambia.",
      ].join("\n"),
    }).catch((error: unknown) => {
      console.error("[email] No se pudo enviar el restablecimiento:", error);
      throw new AppError(
        "No hemos podido enviar el email. Inténtalo de nuevo en unos minutos.",
        "MAIL_FAILED",
        502,
      );
    });

    return { success: true as const, data: { message: GENERIC_RESET_MESSAGE } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function resetPassword(input: unknown) {
  try {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashResetToken(parsed.data.token),
        resetTokenExp: { gt: new Date() },
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new AppError(
        "El enlace no es válido o ha caducado. Pide uno nuevo.",
        "INVALID_TOKEN",
        400,
      );
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