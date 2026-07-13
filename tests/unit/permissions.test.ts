import { describe, expect, it } from "vitest";
import { canManage, hasPermission } from "@/lib/permissions";

describe("permissions", () => {
  it("admin tiene acceso total", () => {
    expect(hasPermission("ADMIN", "settings")).toBe(true);
    expect(canManage("ADMIN", "events")).toBe(true);
  });

  it("miembro consulta pero no gestiona eventos", () => {
    expect(hasPermission("MEMBER", "events")).toBe(true);
    expect(canManage("MEMBER", "events")).toBe(false);
    expect(canManage("MEMBER", "tasks")).toBe(true);
  });

  it("colaborador solo en áreas autorizadas", () => {
    expect(hasPermission("COLLABORATOR", "events", ["events"])).toBe(true);
    expect(hasPermission("COLLABORATOR", "products", ["events"])).toBe(false);
  });
});