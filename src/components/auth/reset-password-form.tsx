"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const result = await resetPassword({ token, password });
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setDone(true);
  }

  if (!token) {
    return (
      <Card className="shadow-poster">
        <CardHeader className="text-center">
          <CardTitle className="poster-title text-3xl">Enlace incompleto</CardTitle>
          <CardDescription>
            Abre el enlace completo del email o pide uno nuevo.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button nativeButton={false} render={<Link href="/forgot-password" />}>Pedir otro enlace</Button>
        </CardFooter>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="shadow-poster">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-band text-band-ink ring-1 ring-ink">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="poster-title text-3xl">Contraseña cambiada</CardTitle>
          <CardDescription>Ya puedes entrar con tu nueva contraseña.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button nativeButton={false} render={<Link href="/login" />}>Ir al login</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-poster">
      <CardHeader>
        <CardTitle className="poster-title text-5xl">Nueva contraseña</CardTitle>
        <CardDescription>Elige una contraseña de al menos 8 caracteres.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña nueva</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Repítela</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Guardar contraseña
          </Button>
          <Button nativeButton={false} variant="ghost" className="w-full" render={<Link href="/login" />}>
            <ArrowLeft />
            Volver al login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
