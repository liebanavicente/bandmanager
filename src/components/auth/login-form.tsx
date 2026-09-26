"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const demoAccounts = [
  { role: "Admin", email: "admin@losvoltios.es", password: "demo1234" },
  { role: "Miembro", email: "miembro@losvoltios.es", password: "demo1234" },
  { role: "Colaborador", email: "tecnicosala@losvoltios.es", password: "demo1234" },
];

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Credenciales incorrectas. Revisa email y contraseña.");
      return;
    }

    toast.success("¡Bienvenido de nuevo!");
    router.push("/");
    router.refresh();
  }

  function fillDemo(account: (typeof demoAccounts)[number]) {
    setEmail(account.email);
    setPassword(account.password);
  }

  return (
    <Card className="stage-edge shadow-poster">
      <CardHeader>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Acceso backstage</p>
        <CardTitle className="poster-title text-4xl">Iniciar sesión</CardTitle>
        <CardDescription className="font-serif text-base italic">
          Accede al panel de gestión de tu banda.{" "}
          <Link href="/presentacion" className="text-primary hover:underline">
            Ver presentación
          </Link>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@banda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste la contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="rounded-lg border border-dashed bg-muted/40 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Pases de demostración
            </p>
            <div className="flex flex-col gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="group flex items-stretch overflow-hidden rounded-md border bg-background text-left text-xs transition-all hover:-translate-y-px hover:shadow-poster-sm"
                >
                  {/* Talón del pase */}
                  <span className="flex w-20 shrink-0 items-center justify-center border-r border-dashed bg-stage-ink px-2 font-display text-sm uppercase tracking-wide text-white transition-colors group-hover:bg-primary">
                    {account.role}
                  </span>
                  <span className="min-w-0 px-3 py-2">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-primary">
                      All access
                    </span>
                    <span className="mt-0.5 block truncate text-muted-foreground">
                      {account.email} · {account.password}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Entrar
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Montando una banda nueva?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrala
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}