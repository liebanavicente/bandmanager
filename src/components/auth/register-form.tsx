"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { KeyRound, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { lookupInvite, registerAccount } from "@/actions/band";
import { isActionSuccess } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InvitedBand = { name: string; logoData: string | null; genre: string | null; city: string | null };

type RegisterFormProps = {
  initialCode: string;
  startJoining: boolean;
  invitedBand: InvitedBand | null;
};

export function RegisterForm({ initialCode, startJoining, invitedBand }: RegisterFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">(startJoining ? "join" : "create");
  const [code, setCode] = useState(initialCode);
  const [band, setBand] = useState<InvitedBand | null>(invitedBand);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const joining = mode === "join";

  async function checkCode(value: string) {
    if (value.replace(/[^a-z0-9]/gi, "").length < 8) {
      setBand(null);
      return;
    }
    setChecking(true);
    const result = await lookupInvite(value);
    setChecking(false);
    setBand(isActionSuccess(result) ? result.data : null);
    if (!isActionSuccess(result)) toast.error(result.error);
  }

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
      instrument: form.get("instrument") ?? "",
      inviteCode: joining ? code : "",
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

    if (result.data.joined) {
      toast.success(`¡Bienvenido a ${result.data.bandName}!`);
      router.push("/");
    } else {
      toast.success("¡Sala creada! Vamos a montar la banda.");
      router.push("/onboarding");
    }
  }

  return (
    <Card className="stage-edge shadow-poster">
      <CardHeader>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Tu pase</p>
        <CardTitle className="poster-title text-4xl">
          {joining ? "Únete a tu banda" : "Monta tu sala"}
        </CardTitle>
        <CardDescription className="font-serif text-base italic">
          {joining
            ? "Pon el código que te ha pasado tu banda y entrarás en su sala: mismo calendario, repertorio y setlists."
            : "Crea la sala de tu banda. Después te daremos un código para que el resto se una."}
        </CardDescription>

        {/* Selector de camino */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Tipo de registro">
          {[
            { value: "create" as const, label: "Montar sala nueva", icon: Sparkles },
            { value: "join" as const, label: "Tengo un código", icon: KeyRound },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={mode === option.value}
              onClick={() => setMode(option.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
                mode === option.value
                  ? "bg-stage-gradient text-stage-ink shadow-poster-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <option.icon className="size-4" />
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {joining && (
            <div className="space-y-2">
              <Label htmlFor="code">Código de la sala</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onBlur={(e) => void checkCode(e.target.value)}
                required
                placeholder="VOLT-7K2Q"
                autoComplete="off"
                className="h-12 text-center font-mono text-xl tracking-[0.3em] uppercase"
              />
              {checking ? (
                <p className="text-xs text-muted-foreground">Buscando la sala…</p>
              ) : band ? (
                <div className="flex items-center gap-3 rounded-lg bg-stage-ink p-3 text-white">
                  {band.logoData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={band.logoData} alt="" className="size-10 rounded-full bg-white/10 object-contain" />
                  ) : (
                    <span className="flex size-10 items-center justify-center rounded-full bg-stage-gradient font-display text-lg text-stage-ink">
                      {band.name
                        .split(/\s+/)
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-white/55">Vas a entrar en</span>
                    <span className="block truncate font-serif text-lg italic">{band.name}</span>
                  </span>
                </div>
              ) : null}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instrument">Tu función</Label>
              <Input id="instrument" name="instrument" placeholder="Voz, bajo, técnico…" />
            </div>
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
            {joining ? "Entrar en la sala" : "Crear sala y empezar"}
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
