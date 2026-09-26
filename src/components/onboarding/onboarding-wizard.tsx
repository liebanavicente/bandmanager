"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ImageUp,
  Loader2,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { completeOnboarding } from "@/actions/band";
import { isActionSuccess } from "@/lib/action-result";
import { logoToDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";
import type { BandLinks } from "@/lib/workspace";
import { StageLights } from "@/components/art/stage-lights";
import { Vinyl } from "@/components/art/vinyl";
import { Waveform } from "@/components/art/waveform";
import { BmLogo } from "@/components/brand/bm-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MemberDraft = {
  key: number;
  name: string;
  instrument: string;
  email: string;
  role: "MEMBER" | "COLLABORATOR";
};

type Initial = {
  name: string;
  logoData: string;
  genre: string;
  city: string;
  foundedYear: string;
  bio: string;
  hasStore: boolean | null;
  storeUrl: string;
  links: BandLinks;
};

type WizardProps = {
  adminName: string;
  rerun: boolean;
  initial: Initial;
};

type CreatedMember = { id: string; name: string; email: string | null; tempPassword: string | null };

const INSTRUMENTS = ["Voz", "Guitarra", "Bajo", "Batería", "Teclados", "Saxo", "DJ / Samples", "Coros"];
const CREW_ROLES = ["Técnico de sonido", "Mánager", "Road manager", "Diseño / Merch"];
const GENRES = ["Rock", "Pop", "Indie", "Punk", "Metal", "Folk", "Electrónica", "Jazz", "Rap", "Flamenco"];
const EVENT_TYPES = [
  { value: "CONCERT", label: "Concierto" },
  { value: "REHEARSAL", label: "Ensayo" },
  { value: "RECORDING", label: "Grabación" },
  { value: "PROMO", label: "Promo" },
] as const;
const LINKS: { key: keyof BandLinks; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/tubanda" },
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@tubanda" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@tubanda" },
  { key: "web", label: "Web", placeholder: "https://tubanda.com" },
];

const STEPS = [
  { id: "name", kicker: "Lo primero", question: "¿Cómo se llama la banda?" },
  { id: "logo", kicker: "La imagen", question: "Sube tu logo" },
  { id: "sound", kicker: "El sonido", question: "¿Qué sonáis y de dónde sois?" },
  { id: "you", kicker: "Tú", question: "¿Y tú qué tocas?" },
  { id: "members", kicker: "La formación", question: "¿Quién más se sube al escenario?" },
  { id: "songs", kicker: "El repertorio", question: "¿Qué canciones tocáis?" },
  { id: "store", kicker: "El merch", question: "¿Tenéis tienda?" },
  { id: "links", kicker: "Las redes", question: "¿Dónde os encontramos?" },
  { id: "event", kicker: "La agenda", question: "¿Cuál es el próximo bolo?" },
  { id: "review", kicker: "Prueba de sonido", question: "¿Todo en orden?" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
        active
          ? "border-transparent bg-stage-gradient text-stage-ink shadow-poster-red"
          : "border-foreground/15 bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const bigInput = "h-14 rounded-xl px-4 text-xl md:text-xl";

export function OnboardingWizard({ adminName, rerun, initial }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<CreatedMember[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(1);

  const [name, setName] = useState(initial.name);
  const [logoData, setLogoData] = useState(initial.logoData);
  const [genre, setGenre] = useState(initial.genre);
  const [city, setCity] = useState(initial.city);
  const [foundedYear, setFoundedYear] = useState(initial.foundedYear);
  const [bio, setBio] = useState(initial.bio);
  const [myInstrument, setMyInstrument] = useState("");
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [songs, setSongs] = useState("");
  const [hasStore, setHasStore] = useState<boolean | null>(initial.hasStore);
  const [storeUrl, setStoreUrl] = useState(initial.storeUrl);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [links, setLinks] = useState<BandLinks>(initial.links);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]["value"]>("CONCERT");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");

  const current = STEPS[step];
  const bandName = name.trim() || "Tu banda";
  const songList = songs
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const validMembers = members.filter((m) => m.name.trim());

  function canContinue(id: StepId) {
    if (id === "name") return name.trim().length > 0;
    if (id === "store") return hasStore !== null;
    if (id === "members") return members.every((m) => m.name.trim() || (!m.instrument && !m.email));
    return true;
  }

  function go(delta: number) {
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  }

  function next() {
    if (!canContinue(current.id)) {
      toast.error(current.id === "name" ? "Ponle nombre a la banda." : "Completa este paso para seguir.");
      return;
    }
    go(1);
  }

  async function handleLogo(file: File | undefined) {
    if (!file) return;
    try {
      setLogoData(await logoToDataUrl(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el logo.");
    }
  }

  function addMember() {
    setMembers((list) => [
      ...list,
      { key: nextKey.current++, name: "", instrument: "", email: "", role: "MEMBER" },
    ]);
  }

  function updateMember(key: number, patch: Partial<MemberDraft>) {
    setMembers((list) => list.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  async function submit() {
    setSaving(true);
    const result = await completeOnboarding({
      name,
      logoData,
      genre,
      city,
      foundedYear: foundedYear || undefined,
      bio,
      myInstrument,
      members: validMembers.map(({ name, instrument, email, role }) => ({ name, instrument, email, role })),
      songTitles: songList,
      hasStore: Boolean(hasStore),
      storeUrl,
      firstProduct:
        hasStore && productName.trim()
          ? { name: productName, priceEuros: productPrice || 0, category: "Merch" }
          : undefined,
      links,
      firstEvent:
        eventTitle.trim() && eventDate
          ? { title: eventTitle, type: eventType, startAt: new Date(eventDate).toISOString(), venue: eventVenue }
          : undefined,
    });
    setSaving(false);

    if (!isActionSuccess(result)) {
      toast.error(result.error);
      return;
    }
    setDone(result.data.members);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (e.key === "Enter" && target.tagName === "INPUT" && current.id !== "review") {
      e.preventDefault();
      next();
    }
  }

  if (done) {
    return <Finale bandName={bandName} logoData={logoData} members={done} onEnter={() => router.push("/")} />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" onKeyDown={handleKeyDown}>
      {/* Cartel: la pregunta en grande */}
      <aside className="stage-surface grain relative isolate flex flex-col justify-between gap-8 overflow-hidden p-6 sm:p-10">
        <StageLights />
        <Vinyl
          spin
          label={bandName}
          className="pointer-events-none absolute -bottom-32 -right-32 -z-10 size-80 opacity-60 lg:size-[28rem]"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BmLogo size={32} />
            <span className="poster-title text-lg text-white">
              Band<span className="text-stage-gradient">Manager</span>
            </span>
          </div>
          {rerun && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => router.push("/")}
            >
              <X />
              Salir
            </Button>
          )}
        </div>

        <div key={current.id} className="animate-in fade-in slide-in-from-bottom-3 space-y-4 duration-500">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-stage-amber">
            Pista {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")} · {current.kicker}
          </p>
          <h1 className="poster-title text-5xl text-white sm:text-6xl xl:text-7xl">{current.question}</h1>
          {step === 0 && (
            <p className="max-w-md font-serif text-xl italic text-white/75">
              Hola, {adminName}. Diez preguntas rápidas y el backstage queda listo: formación,
              repertorio, merch y agenda.
            </p>
          )}
        </div>

        {/* Tracklist de progreso */}
        <ol className="hidden gap-1.5 lg:flex" aria-label="Progreso">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex-1">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                aria-label={`Paso ${i + 1}: ${s.kicker}`}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "block h-1.5 w-full rounded-full transition-all",
                  i < step && "cursor-pointer bg-stage-amber hover:bg-white",
                  i === step && "bg-stage-gradient",
                  i > step && "bg-white/15",
                )}
              />
            </li>
          ))}
        </ol>
      </aside>

      {/* Respuesta */}
      <main className="flex flex-col px-5 py-8 sm:px-10 lg:py-16">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          <div key={current.id} className="animate-in fade-in slide-in-from-right-4 flex-1 space-y-6 duration-300">
            {current.id === "name" && (
              <>
                <Field label="Nombre de la banda" htmlFor="band-name">
                  <Input
                    id="band-name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre de tu banda"
                    className={cn(bigInput, "h-16 font-display text-3xl uppercase tracking-wide md:text-3xl")}
                    maxLength={120}
                  />
                </Field>
                <p className="font-serif text-lg italic text-muted-foreground">
                  Así aparecerá en el backstage, en la galleta del vinilo y en los setlists.
                </p>
              </>
            )}

            {current.id === "logo" && (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleLogo(e.dataTransfer.files[0]);
                  }}
                  className="group relative flex aspect-square w-full max-w-72 flex-col items-center justify-center gap-3 overflow-hidden rounded-full border-2 border-dashed border-foreground/20 bg-card transition-all hover:border-primary hover:shadow-poster-red"
                >
                  {logoData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoData} alt="Vista previa del logo" className="size-full object-contain p-8" />
                  ) : (
                    <>
                      <span className="flex size-14 items-center justify-center rounded-full bg-stage-gradient text-stage-ink transition-transform group-hover:scale-110">
                        <ImageUp className="size-6" />
                      </span>
                      <span className="font-display text-xl uppercase">Suelta aquí tu logo</span>
                      <span className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG</span>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="sr-only"
                  onChange={(e) => void handleLogo(e.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                    <ImageUp />
                    {logoData ? "Cambiar logo" : "Elegir archivo"}
                  </Button>
                  {logoData && (
                    <Button type="button" variant="ghost" onClick={() => setLogoData("")}>
                      <Trash2 />
                      Quitar
                    </Button>
                  )}
                </div>
                <p className="font-serif text-lg italic text-muted-foreground">
                  ¿Aún no tenéis logo? Sin problema: usaremos vuestras iniciales hasta que lo tengáis.
                </p>
              </div>
            )}

            {current.id === "sound" && (
              <div className="space-y-6">
                <Field label="Estilo">
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((g) => (
                      <Chip key={g} active={genre === g} onClick={() => setGenre(genre === g ? "" : g)}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                  <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="…o escríbelo: garage-soul, cumbia psicodélica…" className="mt-2 h-11 rounded-xl" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                  <Field label="Ciudad" htmlFor="city">
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Madrid" className="h-11 rounded-xl" />
                  </Field>
                  <Field label="Desde" htmlFor="founded">
                    <Input id="founded" type="number" inputMode="numeric" min={1900} max={2100} value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="2019" className="h-11 rounded-xl" />
                  </Field>
                </div>
                <Field label="Bio en una frase" htmlFor="bio">
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Cuarteto de pop-rock eléctrico con alma de directo." className="min-h-24 rounded-xl text-base" maxLength={1000} />
                </Field>
              </div>
            )}

            {current.id === "you" && (
              <div className="space-y-4">
                <Field label="Tu función en la banda">
                  <div className="flex flex-wrap gap-2">
                    {[...INSTRUMENTS, ...CREW_ROLES].map((i) => (
                      <Chip key={i} active={myInstrument === i} onClick={() => setMyInstrument(myInstrument === i ? "" : i)}>
                        {i}
                      </Chip>
                    ))}
                  </div>
                  <Input value={myInstrument} onChange={(e) => setMyInstrument(e.target.value)} placeholder="…o varias: Guitarra y voz" className="mt-2 h-11 rounded-xl" />
                </Field>
              </div>
            )}

            {current.id === "members" && (
              <div className="space-y-4">
                <p className="font-serif text-lg italic text-muted-foreground">
                  Añade a cada componente y su función. Si pones su email, le crearemos acceso con una
                  contraseña temporal; si no, quedará como ficha.
                </p>
                {members.length === 0 && (
                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    ¿Proyecto en solitario? Puedes saltar este paso.
                  </div>
                )}
                <ol className="space-y-3">
                  {members.map((m, i) => (
                    <li key={m.key} className="stage-edge relative overflow-hidden rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-display text-lg uppercase">Componente {i + 1}</span>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Quitar componente ${i + 1}`} onClick={() => setMembers((list) => list.filter((x) => x.key !== m.key))}>
                          <X />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input autoFocus={i === members.length - 1} value={m.name} onChange={(e) => updateMember(m.key, { name: e.target.value })} placeholder="Nombre" aria-label={`Nombre del componente ${i + 1}`} className="h-10 rounded-lg" />
                        <Input value={m.instrument} onChange={(e) => updateMember(m.key, { instrument: e.target.value })} placeholder="Función: Bajo, Batería…" aria-label={`Función del componente ${i + 1}`} list="instrument-options" className="h-10 rounded-lg" />
                        <Input type="email" value={m.email} onChange={(e) => updateMember(m.key, { email: e.target.value })} placeholder="Email (opcional, para darle acceso)" aria-label={`Email del componente ${i + 1}`} className="h-10 rounded-lg sm:col-span-2" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Chip active={m.role === "MEMBER"} onClick={() => updateMember(m.key, { role: "MEMBER" })}>Músico</Chip>
                        <Chip active={m.role === "COLLABORATOR"} onClick={() => updateMember(m.key, { role: "COLLABORATOR" })}>Equipo / colaborador</Chip>
                      </div>
                    </li>
                  ))}
                </ol>
                <datalist id="instrument-options">
                  {[...INSTRUMENTS, ...CREW_ROLES].map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
                <Button type="button" variant="outline" size="lg" className="w-full border-dashed" onClick={addMember}>
                  <Plus />
                  Añadir componente
                </Button>
              </div>
            )}

            {current.id === "songs" && (
              <div className="space-y-4">
                <Field label="Una canción por línea" htmlFor="songs" hint={songList.length ? `${songList.length} canciones → irán a tu "Repertorio principal".` : "Puedes dejarlo vacío y añadirlas luego."}>
                  <Textarea id="songs" value={songs} onChange={(e) => setSongs(e.target.value)} placeholder={"Luces de neón\nMedianoche en Madrid\nEstrella fugaz"} className="min-h-56 rounded-xl font-mono text-base leading-7" />
                </Field>
                {songList.length > 0 && <Waveform seed={songList.join("|")} bars={64} progress={Math.min(1, songList.length / 12)} className="h-10 text-foreground" />}
              </div>
            )}

            {current.id === "store" && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: true, title: "Sí, vendemos merch", text: "Activamos Productos, Pedidos y venta rápida en concierto." },
                    { value: false, title: "Todavía no", text: "Ocultamos la tienda. La podéis activar cuando queráis en Ajustes." },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setHasStore(opt.value)}
                      aria-pressed={hasStore === opt.value}
                      className={cn(
                        "rounded-2xl border-2 p-5 text-left transition-all",
                        hasStore === opt.value
                          ? "border-primary bg-primary/10 shadow-poster-red"
                          : "border-foreground/10 bg-card hover:-translate-y-0.5 hover:border-primary/40",
                      )}
                    >
                      <span className="flex items-center gap-2 font-display text-2xl uppercase">
                        {opt.value ? <ShoppingBag className="size-5 text-primary" /> : <X className="size-5 text-muted-foreground" />}
                        {opt.title}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{opt.text}</span>
                    </button>
                  ))}
                </div>
                {hasStore && (
                  <div className="animate-in fade-in slide-in-from-top-2 space-y-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                    <Field label="¿Tienda online? (opcional)" htmlFor="store-url">
                      <Input id="store-url" type="url" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://tienda.tubanda.com" className="h-11 rounded-xl" />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                      <Field label="Primer producto (opcional)" htmlFor="product-name">
                        <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Camiseta logo" className="h-11 rounded-xl" />
                      </Field>
                      <Field label="Precio €" htmlFor="product-price">
                        <Input id="product-price" type="number" min={0} step="0.5" inputMode="decimal" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="20" className="h-11 rounded-xl" />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            )}

            {current.id === "links" && (
              <div className="space-y-4">
                {LINKS.map((l) => (
                  <Field key={l.key} label={l.label} htmlFor={`link-${l.key}`}>
                    <Input
                      id={`link-${l.key}`}
                      type="url"
                      value={links[l.key] ?? ""}
                      onChange={(e) => setLinks((prev) => ({ ...prev, [l.key]: e.target.value }))}
                      placeholder={l.placeholder}
                      className="h-11 rounded-xl"
                    />
                  </Field>
                ))}
              </div>
            )}

            {current.id === "event" && (
              <div className="space-y-5">
                <Field label="Tipo">
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map((t) => (
                      <Chip key={t.value} active={eventType === t.value} onClick={() => setEventType(t.value)}>
                        {t.label}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <Field label="Nombre" htmlFor="event-title">
                  <Input id="event-title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Concierto en Sala Copérnico" className="h-12 rounded-xl text-lg md:text-lg" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fecha y hora" htmlFor="event-date">
                    <Input id="event-date" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-11 rounded-xl" />
                  </Field>
                  <Field label="Sala / lugar" htmlFor="event-venue">
                    <Input id="event-venue" value={eventVenue} onChange={(e) => setEventVenue(e.target.value)} placeholder="Sala Copérnico" className="h-11 rounded-xl" />
                  </Field>
                </div>
                <p className="font-serif text-lg italic text-muted-foreground">
                  Con fecha, el panel arranca la cuenta atrás. Si aún no hay bolo, salta este paso.
                </p>
              </div>
            )}

            {current.id === "review" && (
              <div className="space-y-3">
                <ReviewRow label="Banda" value={bandName} onEdit={() => setStep(0)} />
                <ReviewRow label="Logo" value={logoData ? "Subido" : "Iniciales por ahora"} onEdit={() => setStep(1)} />
                <ReviewRow label="Sonido" value={[genre, city, foundedYear && `desde ${foundedYear}`].filter(Boolean).join(" · ") || "—"} onEdit={() => setStep(2)} />
                <ReviewRow label="Tú" value={myInstrument || "—"} onEdit={() => setStep(3)} />
                <ReviewRow label="Formación" value={validMembers.length ? validMembers.map((m) => `${m.name}${m.instrument ? ` (${m.instrument})` : ""}`).join(", ") : "Solo tú"} onEdit={() => setStep(4)} />
                <ReviewRow label="Repertorio" value={songList.length ? `${songList.length} canciones` : "—"} onEdit={() => setStep(5)} />
                <ReviewRow label="Tienda" value={hasStore ? `Sí${productName ? ` · ${productName}` : ""}` : "No"} onEdit={() => setStep(6)} />
                <ReviewRow label="Redes" value={Object.values(links).filter(Boolean).length ? `${Object.values(links).filter(Boolean).length} enlaces` : "—"} onEdit={() => setStep(7)} />
                <ReviewRow label="Próximo bolo" value={eventTitle && eventDate ? `${eventTitle} · ${new Date(eventDate).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}` : "—"} onEdit={() => setStep(8)} />
                {rerun && (
                  <p className="pt-2 text-xs text-muted-foreground">
                    Ya tenías la banda configurada: actualizaremos la ficha y añadiremos los componentes,
                    canciones y eventos nuevos sin borrar nada.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="sticky bottom-0 mt-10 flex items-center justify-between gap-3 border-t bg-background/90 py-4 backdrop-blur-sm">
            <Button type="button" variant="ghost" onClick={() => go(-1)} disabled={step === 0 || saving}>
              <ArrowLeft />
              Atrás
            </Button>
            <div className="flex items-center gap-2">
              {!["name", "store", "review"].includes(current.id) && (
                <Button type="button" variant="ghost" onClick={() => go(1)} className="text-muted-foreground">
                  Saltar
                </Button>
              )}
              {current.id === "review" ? (
                <Button type="button" size="lg" onClick={submit} disabled={saving} className="font-display text-lg uppercase tracking-wider">
                  {saving ? <Loader2 className="animate-spin" /> : <Check />}
                  ¡Que empiece el show!
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={next} disabled={!canContinue(current.id)} className="font-display text-lg uppercase tracking-wider">
                  Siguiente
                  <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onEdit} className="shrink-0 text-primary">
        Cambiar
      </Button>
    </div>
  );
}

function Finale({
  bandName,
  logoData,
  members,
  onEnter,
}: {
  bandName: string;
  logoData: string;
  members: CreatedMember[];
  onEnter: () => void;
}) {
  const withAccess = members.filter((m) => m.email && m.tempPassword);

  function copyAll() {
    const text = withAccess.map((m) => `${m.name} — ${m.email} / ${m.tempPassword}`).join("\n");
    void navigator.clipboard.writeText(text).then(
      () => toast.success("Accesos copiados"),
      () => toast.error("No se pudo copiar"),
    );
  }

  return (
    <div className="stage-surface grain relative isolate flex min-h-screen items-center justify-center overflow-hidden p-6">
      <StageLights />
      <Vinyl spin label={bandName} className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[40rem] -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <div className="animate-in fade-in zoom-in-95 w-full max-w-xl space-y-8 text-center duration-700">
        {logoData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoData} alt={`Logo de ${bandName}`} className="mx-auto size-28 rounded-full bg-white/5 object-contain p-2 ring-4 ring-white/15" />
        ) : (
          <BmLogo size={96} className="mx-auto" />
        )}
        <div className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-stage-amber">Backstage listo</p>
          <h1 className="poster-title text-6xl text-white sm:text-7xl">
            {bandName}, <span className="text-stage-gradient">a escena.</span>
          </h1>
        </div>

        {withAccess.length > 0 && (
          <div className="space-y-3 rounded-2xl bg-black/40 p-5 text-left ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                Pases para la banda · compártelos ahora
              </p>
              <Button size="sm" variant="ghost" onClick={copyAll} className="text-white hover:bg-white/10 hover:text-white">
                <Copy />
                Copiar
              </Button>
            </div>
            <ul className="space-y-2">
              {withAccess.map((m) => (
                <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-sm text-white">
                  <span className="font-medium">{m.name}</span>
                  <span className="font-mono text-xs text-white/70">
                    {m.email} · <span className="text-stage-amber">{m.tempPassword}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-white/50">
              Las contraseñas temporales no se volverán a mostrar. Cada persona puede cambiarla con
              «¿Olvidaste la contraseña?».
            </p>
          </div>
        )}

        <Button size="lg" onClick={onEnter} className="h-14 px-8 font-display text-xl uppercase tracking-wider">
          Entrar al backstage
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
