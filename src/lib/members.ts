import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import type { Prisma, UserRole } from "@prisma/client";
import { AppError } from "@/lib/errors";

type NewMember = {
  name: string;
  instrument?: string;
  email?: string;
  role: UserRole;
};

export type CreatedMember = {
  id: string;
  name: string;
  email: string | null;
  /** Contraseña temporal para compartir con el componente (solo si tiene email). */
  tempPassword: string | null;
};

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "componente"
  );
}

/** Contraseña temporal legible (sin caracteres ambiguos). */
export function generateTempPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/**
 * Da de alta a un componente de la banda. Con email, recibe acceso con una
 * contraseña temporal; sin email, queda como ficha sin acceso (inactivo)
 * con un email interno no enrutable.
 */
export async function createBandMember(
  tx: Prisma.TransactionClient,
  member: NewMember,
): Promise<CreatedMember> {
  if (member.email) {
    const existing = await tx.user.findUnique({ where: { email: member.email } });
    if (existing) {
      throw new AppError(`Ya existe una cuenta con el email ${member.email}.`, "CONFLICT", 409);
    }
  }

  const tempPassword = member.email ? generateTempPassword() : null;
  const email =
    member.email ?? `${slugify(member.name)}-${randomBytes(3).toString("hex")}@sin-acceso.bandmanager`;
  const passwordHash = await bcrypt.hash(tempPassword ?? randomBytes(24).toString("hex"), 10);

  const user = await tx.user.create({
    data: {
      email,
      passwordHash,
      role: member.role,
      isActive: Boolean(member.email),
      profile: {
        create: {
          name: member.name,
          instrument: member.instrument,
          joinedAt: new Date(),
        },
      },
    },
  });

  return { id: user.id, name: member.name, email: member.email ?? null, tempPassword };
}

/** Indica si el email es el interno de un componente sin acceso. */
export function isPlaceholderEmail(email: string) {
  return email.endsWith("@sin-acceso.bandmanager");
}
