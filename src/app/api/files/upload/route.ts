import { NextResponse } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { AppError, toActionError } from "@/lib/errors";
import { ALLOWED_MIME_TYPES, bandStoragePrefix, getMaxFileSizeBytes } from "@/lib/files";
import { requirePermission } from "@/lib/permissions";
import { getCollaboratorAreas, getOptionalSessionUser } from "@/lib/session";

/**
 * Firma las subidas directas del navegador a Vercel Blob (así los archivos
 * no pasan por la función, limitada a 4,5 MB). Cada firma vale solo para
 * subir una ruta concreta dentro de la carpeta de la sala del usuario, con
 * los tipos y el tamaño permitidos. Funciona con OIDC (BLOB_STORE_ID) o con
 * BLOB_READ_WRITE_TOKEN. El registro en la base de datos lo hace después
 * registerUploadedFile.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
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

        const limits = {
          allowedContentTypes: [...ALLOWED_MIME_TYPES],
          maximumSizeInBytes: getMaxFileSizeBytes(),
        };
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 10 * 60 * 1000,
          ...limits,
        });
        return { token, urlOptions: limits };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(toActionError(error), { status: 400 });
  }
}
