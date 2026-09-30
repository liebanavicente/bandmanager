import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { AppError, toActionError } from "@/lib/errors";
import { ALLOWED_MIME_TYPES, bandStoragePrefix, getMaxFileSizeBytes } from "@/lib/files";
import { requirePermission } from "@/lib/permissions";
import { getCollaboratorAreas, getOptionalSessionUser } from "@/lib/session";

/**
 * Firma las subidas directas del navegador a Vercel Blob (así los archivos
 * no pasan por la función, limitada a 4,5 MB). Solo deja subir a la
 * carpeta de la sala del usuario, con los tipos y el tamaño permitidos.
 * El registro en la base de datos lo hace después registerUploadedFile.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getOptionalSessionUser();
        if (!user) {
          throw new AppError("Debes iniciar sesión.", "UNAUTHORIZED", 401);
        }
        const areas =
          user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
        requirePermission(user.role, "files", areas);

        if (!pathname.startsWith(bandStoragePrefix(user.bandId)) || pathname.includes("..")) {
          throw new AppError("Ruta de archivo inválida.", "INVALID_PATH", 400);
        }

        return {
          allowedContentTypes: [...ALLOWED_MIME_TYPES],
          maximumSizeInBytes: getMaxFileSizeBytes(),
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(toActionError(error), { status: 400 });
  }
}
