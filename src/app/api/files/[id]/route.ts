import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { readStoredFile } from "@/lib/files";
import { getCollaboratorAreas } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const areas =
      session.user.role === "COLLABORATOR"
        ? await getCollaboratorAreas(session.user.id)
        : undefined;

    try {
      requirePermission(session.user.role, "files", areas);
    } catch {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const file = await prisma.fileAsset.findFirst({
      where: { id, deletedAt: null },
    });

    if (!file) {
      return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
    }

    const buffer = await readStoredFile(file.storagePath);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Cache-Control": "private, max-age=3600",
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