"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { deleteStoredFile, storeFile } from "@/lib/files";
import { fileFiltersSchema, uploadFileMetadataSchema } from "@/lib/validations";

async function authorizeFiles() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "files", areas);
  return user;
}

export async function listFiles(input: unknown = {}) {
  try {
    await authorizeFiles();
    const parsed = fileFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, category, eventId, taskId } = parsed.data;
    const where = {
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
    await authorizeFiles();
    const file = await prisma.fileAsset.findFirst({
      where: { id, deletedAt: null },
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

    const subdirectory = parsed.data.eventId
      ? `events/${parsed.data.eventId}`
      : parsed.data.taskId
        ? `tasks/${parsed.data.taskId}`
        : "general";

    const stored = await storeFile(file, subdirectory);

    const asset = await prisma.fileAsset.create({
      data: {
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
      where: { id, deletedAt: null },
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