import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SlideDeck } from "@/components/presentation/slide-deck";

export const metadata: Metadata = {
  title: "Presentación",
  description:
    "Descubre las funciones de BandManager: eventos, repertorio, setlists, tareas y merchandising para tu banda.",
};

export default async function PresentacionPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return <SlideDeck />;
}