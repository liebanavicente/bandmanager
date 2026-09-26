"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { deleteStoredFile, storeFile } from "@/lib/files";
import { assertInBand } from "@/lib/band-scope";
import {
  fileFiltersSchema,
  updateFileMetadataSchema,
  uploadFileMetadataSchema,
} from "@/lib/validations";

async function authorizeFiles() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "files", areas);
  return user;
}

export async function listFiles(input: unknown = {}) {
  try {
    const user = await authorizeFiles();
    const parsed = fileFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, category, eventId, taskId } = parsed.data;
    const where = {
      bandId: user.bandId,
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(eventId ? { eventId } : {}),
      ...(taskId ? { taskId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { tags: { has: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.fileAsset.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          uploadedBy: { include: { profile: true } },
          event: true,
          task: true,
        },
      }),
      prisma.fileAsset.count({ where }),
    ]);

    return { success: true as const, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getFileMetadata(id: string) {
  try {
    const user = await authorizeFiles();
    const file = await prisma.fileAsset.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
      include: {
        uploadedBy: { include: { profile: true } },
        event: true,
        task: true,
      },
    });

    if (!file) {
      throw new AppError("Archivo no encontrado.", "NOT_FOUND", 404);
    }

    return {
      success: true as const,
      data: {
        ...file,
        downloadUrl: `/api/files/${file.id}`,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function uploadFile(formData: FormData) {
  try {
    const user = await authorizeFiles();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("Debes seleccionar un archivo.", "VALIDATION", 400);
    }

    const metadataInput = {
      name: formData.get("name")?.toString(),
      description: formData.get("description")?.toString(),
      category: formData.get("category")?.toString(),
      tags: formData.get("tags")?.toString()?.split(",").map((tag) => tag.trim()).filter(Boolean),
      eventId: formData.get("eventId")?.toString(),
      taskId: formData.get("taskId")?.toString(),
    };

    const parsed = uploadFileMetadataSchema.safeParse(metadataInput);
    if (!parsed.success) {
      throw new AppError("Metadatos del archivo inválidos.", "VALIDATION", 400);
    }

    await assertInBand(prisma, "event", [parsed.data.eventId], user.bandId);
    await assertInBand(prisma, "task", [parsed.data.taskId], user.bandId);

    // Cada sala guarda sus archivos en su propia carpeta
    const scope = parsed.data.eventId
      ? `events/${parsed.data.eventId}`
      : parsed.data.taskId
        ? `tasks/${parsed.data.taskId}`
        : "general";
    const subdirectory = `bands/${user.bandId}/${scope}`;

    const stored = await storeFile(file, subdirectory);

    const asset = await prisma.fileAsset.create({
      data: {
        bandId: user.bandId,
        name: parsed.data.name ?? stored.originalName,
        description: parsed.data.description,
        category: parsed.data.category,
        tags: parsed.data.tags,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        storagePath: stored.storagePath,
        uploadedById: user.id,
        eventId: parsed.data.eventId,
        taskId: parsed.data.taskId,
      },
      include: {
        uploadedBy: { include: { profile: true } },
      },
    });

    return {
      success: true as const,
      data: {
        ...asset,
        downloadUrl: `/api/files/${asset.id}`,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteFile(id: string) {
  try {
    const user = await authorizeFiles();
    const file = await prisma.fileAsset.findFirst({
      where: { id, bandId: user.bandId, deletedAt: null },
    });

    if (!file) {
      throw new AppError("Archivo no encontrado.", "NOT_FOUND", 404);
    }

    if (user.role !== "ADMIN" && file.uploadedById !== user.id) {
      throw new AppError("No tienes permisos para eliminar este archivo.", "FORBIDDEN", 403);
    }

    await prisma.fileAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await deleteStoredFile(file.storagePath);

    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}
export async function updateFile(input: unknown) {
  try {
    const user = await authorizeFiles();
    const parsed = updateFileMetadataSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del archivo inválidos.", "VALIDATION", 400);
    }

    const { id, ...data } = parsed.data;
    const file = await prisma.fileAsset.findFirst({ where: { id, bandId: user.bandId, deletedAt: null } });
    if (!file) {
      throw new AppError("Archivo no encontrado.", "NOT_FOUND", 404);
    }
    if (user.role !== "ADMIN" && file.uploadedById !== user.id) {
      throw new AppError("No tienes permisos para editar este archivo.", "FORBIDDEN", 403);
    }

    const updated = await prisma.fileAsset.update({
      where: { id },
      data: { ...data, description: data.description ?? null },
    });
    return { success: true as const, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}
