import { signOut } from "@/lib/auth";

/** Cierra la sesión (p. ej. si la cuenta ya no pertenece a la sala) y vuelve al login. */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
