"use server";

import { headers } from "next/headers";
import type { FeedbackKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getSessionUser } from "@/lib/session";
import { appUrl, escapeHtml, sendMail } from "@/lib/mail";
import { createFeedbackSchema } from "@/lib/validations";

const kindLabels: Record<FeedbackKind, string> = {
  BUG: "Fallo",
  IDEA: "Idea",
  CONFUSING: "Me ha confundido",
};

export async function createFeedback(input: unknown) {
  try {
    const user = await getSessionUser();
    const parsed = createFeedbackSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Datos inválidos.", "VALIDATION", 400);
    }

    const userAgent = (await headers()).get("user-agent")?.slice(0, 500) ?? null;
    const feedback = await prisma.feedback.create({
      data: {
        bandId: user.bandId,
        userId: user.id,
        kind: parsed.data.kind,
        message: parsed.data.message,
        path: parsed.data.path ?? null,
        userAgent,
      },
      include: { band: { select: { name: true } } },
    });

    // Aviso al equipo del piloto; si falla, el feedback ya está guardado.
    const notify = process.env.FEEDBACK_NOTIFY_EMAIL;
    if (notify) {
      const kind = kindLabels[feedback.kind];
      const where = feedback.path ? appUrl(feedback.path) : "(sin pantalla)";
      await sendMail({
        to: notify,
        replyTo: user.email,
        subject: `[Feedback · ${kind}] ${feedback.band.name} — ${user.name}`,
        text: `${feedback.message}\n\n—\n${user.name} <${user.email}>\nBanda: ${feedback.band.name}\nPantalla: ${where}\nNavegador: ${userAgent ?? "?"}`,
        html: `<p style="white-space:pre-wrap">${escapeHtml(feedback.message)}</p><hr><p>${escapeHtml(user.name)} &lt;${escapeHtml(user.email)}&gt;<br>Banda: ${escapeHtml(feedback.band.name)}<br>Pantalla: ${escapeHtml(where)}<br>Navegador: ${escapeHtml(userAgent ?? "?")}</p>`,
      }).catch((error: unknown) => console.error("[email] Aviso de feedback no enviado:", error));
    }

    return { success: true as const, data: { id: feedback.id } };
  } catch (error) {
    return toActionError(error);
  }
}
