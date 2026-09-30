export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { FeedbackKind } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPilotFeedback, getPilotMetrics, isPilotAdmin } from "@/lib/pilot";
import { getOptionalSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Piloto" };

const kindLabels: Record<FeedbackKind, string> = {
  BUG: "Fallo",
  IDEA: "Idea",
  CONFUSING: "Confusión",
};
const kindVariants: Record<FeedbackKind, "destructive" | "default" | "secondary"> = {
  BUG: "destructive",
  IDEA: "default",
  CONFUSING: "secondary",
};

function ago(date: Date | null) {
  return date ? formatDistanceToNow(date, { addSuffix: true, locale: es }) : "nunca";
}

/** Panel interno del piloto: solo para PILOT_ADMIN_EMAILS. */
export default async function PilotPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getOptionalSessionUser();
  if (!user) redirect("/login");
  if (!isPilotAdmin(user.email)) notFound();

  const { tipo } = await searchParams;
  const kind = typeof tipo === "string" && tipo in kindLabels ? (tipo as FeedbackKind) : undefined;
  const [bands, feedback] = await Promise.all([getPilotMetrics(), getPilotFeedback(kind)]);

  const activeBands = bands.filter((b) => b.activeMembers > 0).length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-8">
      <PageHeader
        title="Piloto"
        description={`${activeBands} de ${bands.length} bandas activas en los últimos 7 días. Objetivo en la semana 6: 3 o más.`}
      >
        <Link href="/" className="text-sm text-primary hover:underline">
          Volver a mi sala
        </Link>
      </PageHeader>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banda</TableHead>
                <TableHead className="text-right">Activos 7 d / total</TableHead>
                <TableHead className="text-right">Eventos 7 d con asistencia</TableHead>
                <TableHead className="text-right">Setlists (7 d)</TableHead>
                <TableHead className="text-right">Letras ensayadas 7 d</TableHead>
                <TableHead className="text-right">Feedback</TableHead>
                <TableHead>Último uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bands.map((band) => (
                <TableRow key={band.id}>
                  <TableCell>
                    <p className="font-medium">{band.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {band.city ? `${band.city} · ` : ""}desde {format(band.createdAt, "d MMM", { locale: es })}
                    </p>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      band.members > 0 && band.activeMembers / band.members >= 0.75 && "text-primary font-semibold",
                    )}
                  >
                    {band.activeMembers} / {band.members}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {band.eventsThisWeek === 0 ? "—" : `${band.eventsWithAttendance} de ${band.eventsThisWeek}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {band.setlists} ({band.setlistsThisWeek})
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{band.practicedThisWeek}</TableCell>
                  <TableCell className="text-right tabular-nums">{band.feedback}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ago(band.lastSeenAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="poster-title mr-2 text-2xl">Feedback</h2>
          {([undefined, "BUG", "IDEA", "CONFUSING"] as const).map((k) => (
            <Link
              key={k ?? "todo"}
              href={k ? `/piloto?tipo=${k}` : "/piloto"}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                kind === k ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {k ? kindLabels[k] : "Todo"}
            </Link>
          ))}
        </div>

        {feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay mensajes.</p>
        ) : (
          <ul className="space-y-3">
            {feedback.map((item) => (
              <li key={item.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={kindVariants[item.kind]}>{kindLabels[item.kind]}</Badge>
                      <span className="font-medium text-foreground">{item.band.name}</span>
                      <span>·</span>
                      <a href={`mailto:${item.user.email}`} className="hover:underline">
                        {item.user.profile?.name ?? item.user.email}
                      </a>
                      <span>·</span>
                      <span>{format(item.createdAt, "d MMM, HH:mm", { locale: es })}</span>
                      {item.path && (
                        <>
                          <span>·</span>
                          <code className="font-mono">{item.path}</code>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{item.message}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
