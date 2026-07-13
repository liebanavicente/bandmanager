import type { UserRole } from "@prisma/client";

export type PermissionArea =
  | "dashboard"
  | "events"
  | "songs"
  | "repertoires"
  | "setlists"
  | "members"
  | "tasks"
  | "files"
  | "products"
  | "orders"
  | "settings"
  | "integrations";

const rolePermissions: Record<UserRole, PermissionArea[] | "*"> = {
  ADMIN: "*",
  MEMBER: [
    "dashboard",
    "events",
    "songs",
    "repertoires",
    "setlists",
    "tasks",
    "files",
    "products",
    "orders",
  ],
  COLLABORATOR: ["dashboard", "events", "setlists", "tasks", "files"],
};

export function hasPermission(
  role: UserRole,
  area: PermissionArea,
  collaboratorAreas?: string[],
): boolean {
  const perms = rolePermissions[role];
  if (perms === "*") return true;
  if (role === "COLLABORATOR" && collaboratorAreas) {
    return collaboratorAreas.includes(area);
  }
  return perms.includes(area);
}

export function canManage(role: UserRole, area: PermissionArea): boolean {
  if (role === "ADMIN") return true;
  if (role === "MEMBER") {
    return ["tasks", "orders"].includes(area);
  }
  return false;
}

export function requirePermission(
  role: UserRole,
  area: PermissionArea,
  collaboratorAreas?: string[],
): void {
  if (!hasPermission(role, area, collaboratorAreas)) {
    throw new Error("FORBIDDEN");
  }
}