"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerAccount } from "@/actions/band";
import { isActionSuccess } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setLoading(true);

    const result = await registerAccount({
      name: form.get("name"),
      email,
      password,
    });

    if (!isActionSuccess(result)) {
      setLoading(false);
      toast.error(result.error);
      return;
    }

    const login = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (login?.error) {
      toast.error("Cuenta creada, pero no pudimos iniciar sesión. Entra desde el login.");
      router.push("/login");
      return;
    }

    toast.success("¡Cuenta creada! Vamos a montar la banda.");
    router.push("/onboarding");
  }

  return (
    <Card className="stage-edge shadow-poster">
      <CardHeader>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Paso 0 · Tu pase</p>
        <CardTitle className="poster-title text-4xl">Registra tu banda</CardTitle>
        <CardDescription className="font-serif text-base italic">
          Crea tu cuenta de administrador. Después te haremos unas preguntas para
          dejar todo el backstage listo.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tu nombre</Label>
            <Input id="name" name="name" required autoComplete="name" placeholder="Cómo te llama la banda" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" placeholder="tu@banda.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Crear cuenta y empezar
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
