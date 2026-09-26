import { describe, expect, it } from "vitest";
import {
  updateEventSchema,
  updateRepertoireSchema,
  updateSongSchema,
  updateTaskSchema,
} from "@/lib/validations";
import { onboardingSchema, registerSchema } from "@/lib/validations/band";

const id = "ckabcdefghijklmnopqrstuvw";

describe("esquemas de actualización parcial", () => {
  it("no rellenan con valores por defecto los campos omitidos", () => {
    expect(updateRepertoireSchema.parse({ id, name: "Gira" })).toEqual({ id, name: "Gira" });
    expect(updateSongSchema.parse({ id, status: "READY" })).toEqual({ id, status: "READY" });
    expect(updateEventSchema.parse({ id, title: "Bolo" })).toEqual({ id, title: "Bolo" });
  });

  it("convierten un campo vacío en null para poder borrarlo", () => {
    expect(updateSongSchema.parse({ id, artist: "" }).artist).toBeNull();
    expect(updateTaskSchema.parse({ id, assigneeId: "", dueAt: "" })).toMatchObject({
      assigneeId: null,
      dueAt: null,
    });
  });
});

describe("registro y asistente", () => {
  it("normaliza el email y exige contraseña de 8 caracteres", () => {
    expect(registerSchema.parse({ name: "Ana", email: " ANA@Banda.com ", password: "12345678" }).email).toBe(
      "ana@banda.com",
    );
    expect(registerSchema.safeParse({ name: "Ana", email: "a@b.com", password: "123" }).success).toBe(false);
  });

  it("acepta el mínimo (solo nombre) con valores por defecto", () => {
    const parsed = onboardingSchema.parse({ name: "Los Voltios" });
    expect(parsed).toMatchObject({ name: "Los Voltios", hasStore: false, members: [], songTitles: [] });
  });

  it("valida componentes y rechaza logos que no son imagen", () => {
    const parsed = onboardingSchema.parse({
      name: "X",
      members: [{ name: "Lucía", instrument: "Bajo", email: "" }],
    });
    expect(parsed.members[0]).toMatchObject({ name: "Lucía", instrument: "Bajo", role: "MEMBER" });
    expect(parsed.members[0].email).toBeUndefined();
    expect(onboardingSchema.safeParse({ name: "X", logoData: "data:text/html;base64,PHNjcmlwdD4=" }).success).toBe(
      false,
    );
  });
});

describe("códigos de invitación", async () => {
  const { buildInviteCode, normalizeInviteCode } = await import("@/lib/invite");

  it("usan el nombre de la banda como prefijo", () => {
    expect(buildInviteCode("Los Voltios")).toMatch(/^LOSV-[A-Z2-9]{4}$/);
    expect(buildInviteCode("Las Mareas")).toMatch(/^LASM-/);
    expect(buildInviteCode("")).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("normalizan lo que teclea la gente", () => {
    expect(normalizeInviteCode(" volt 2026 ")).toBe("VOLT-2026");
    expect(normalizeInviteCode("volt-2026")).toBe("VOLT-2026");
  });
});
