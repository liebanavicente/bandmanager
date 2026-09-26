import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isRegistrationOpen } from "@/actions/band";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Registra tu banda",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  if (!(await isRegistrationOpen())) {
    return (
      <Card className="stage-edge shadow-poster">
        <CardHeader>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Aforo completo</p>
          <CardTitle className="poster-title text-4xl">Esta banda ya tiene backstage</CardTitle>
          <CardDescription className="font-serif text-base italic">
            El registro solo está abierto para quien monta la banda. Pide a tu
            administrador que te dé de alta desde Miembros y entra con tu email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" render={<Link href="/login" />}>
            Ir a iniciar sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <RegisterForm />;
}
