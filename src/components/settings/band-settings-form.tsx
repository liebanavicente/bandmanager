"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateBand } from "@/actions/band";
import { logoToDataUrl } from "@/lib/image";
import type { BandLinks } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type BandSettings = {
  name: string;
  logoData: string | null;
  genre: string | null;
  city: string | null;
  foundedYear: number | null;
  bio: string | null;
  hasStore: boolean;
  storeUrl: string | null;
  links: BandLinks;
};

const LINK_FIELDS: { key: keyof BandLinks; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "spotify", label: "Spotify" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "web", label: "Web" },
];

/** Ficha de la banda editable: identidad, tienda y redes. */
export function BandSettingsForm({ band }: { band: BandSettings }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<string | null>(band.logoData);
  const [hasStore, setHasStore] = useState(band.hasStore);

  async function handleLogo(file?: File) {
    if (!file) return;
    try {
      setLogo(await logoToDataUrl(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el logo.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "");
    setSaving(true);
    const result = await updateBand({
      name: text("name"),
      logoData: logo === band.logoData ? undefined : logo,
      genre: text("genre"),
      city: text("city"),
      foundedYear: text("foundedYear") || undefined,
      bio: text("bio"),
      hasStore,
      storeUrl: text("storeUrl"),
      links: Object.fromEntries(LINK_FIELDS.map((l) => [l.key, text(`link-${l.key}`)])),
    });
    setSaving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Ficha de la banda guardada");
    router.refresh();
  }

  return (
    <Card className="stage-edge">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Identidad</p>
          <CardTitle className="poster-title text-3xl">Ficha de la banda</CardTitle>
          <CardDescription className="font-serif text-base italic">
            Lo que respondiste en el asistente. Cámbialo cuando queráis.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[12rem_1fr]">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex size-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-foreground/20 bg-muted/40 transition-colors hover:border-primary"
              aria-label="Cambiar logo"
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo de la banda" className="size-full object-contain p-4" />
              ) : (
                <ImageUp className="size-8 text-muted-foreground" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => void handleLogo(e.target.files?.[0])}
            />
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                {logo ? "Cambiar" : "Subir logo"}
              </Button>
              {logo && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setLogo(null)} aria-label="Quitar logo">
                  <Trash2 />
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="b-name">Nombre</Label>
              <Input id="b-name" name="name" required defaultValue={band.name} className="font-display text-lg uppercase" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-genre">Estilo</Label>
              <Input id="b-genre" name="genre" defaultValue={band.genre ?? ""} />
            </div>
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <div className="space-y-2">
                <Label htmlFor="b-city">Ciudad</Label>
                <Input id="b-city" name="city" defaultValue={band.city ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-year">Desde</Label>
                <Input id="b-year" name="foundedYear" type="number" min={1900} max={2100} defaultValue={band.foundedYear ?? undefined} />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="b-bio">Bio</Label>
              <Textarea id="b-bio" name="bio" rows={2} defaultValue={band.bio ?? ""} />
            </div>

            <label className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5 sm:col-span-2">
              <span>
                <span className="block text-sm font-medium">Tienda y merch</span>
                <span className="block text-xs text-muted-foreground">
                  Muestra Productos, Pedidos y la venta rápida.
                </span>
              </span>
              <Switch checked={hasStore} onCheckedChange={setHasStore} />
            </label>
            {hasStore && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="b-store">Tienda online</Label>
                <Input id="b-store" name="storeUrl" type="text" inputMode="url" autoCapitalize="none" defaultValue={band.storeUrl ?? ""} placeholder="https://" />
              </div>
            )}

            {LINK_FIELDS.map((l) => (
              <div key={l.key} className="space-y-2">
                <Label htmlFor={`b-link-${l.key}`}>{l.label}</Label>
                <Input id={`b-link-${l.key}`} name={`link-${l.key}`} type="text" inputMode="url" autoCapitalize="none" defaultValue={band.links[l.key] ?? ""} placeholder="https://" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-between gap-2">
          <Button type="button" variant="ghost" nativeButton={false} render={<Link href="/onboarding" />}>
            <Sparkles />
            Repetir el asistente
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Guardar ficha
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
