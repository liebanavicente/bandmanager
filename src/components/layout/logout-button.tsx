"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth-actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none text-destructive hover:bg-destructive/10 focus:bg-destructive/10 dark:hover:bg-destructive/20"
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </button>
    </form>
  );
}