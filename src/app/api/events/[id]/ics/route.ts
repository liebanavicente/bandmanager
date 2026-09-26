import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEventIcs } from "@/lib/ics";
import { getCollaboratorAreas, getOptionalSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await getOptionalSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const areas =
      user.role === "COLLABORATOR"
        ? await getCollaboratorAreas(user.id)
        : undefined;

    try {
      requirePermission(user.role, "events", areas);
    } catch {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const event = await prisma.event.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
    }

    const ics = generateEventIcs(event);
    const filename = `${event.title.replace(/[^a-zA-Z0-9-_]/g, "_")}.ics`;

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ha ocurrido un error inesperado." },
      { status: 500 },
    );
  }
}