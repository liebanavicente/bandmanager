"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";
import { getLowStockItems } from "@/lib/stock";
import {
  createProductSchema,
  productFiltersSchema,
  updateProductSchema,
} from "@/lib/validations";

async function authorizeProducts() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "products", areas);
  return user;
}

export async function listProducts(input: unknown = {}) {
  try {
    await authorizeProducts();
    const parsed = productFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, category, status, lowStockOnly } = parsed.data;
    const where = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { sku: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { variants: true },
      }),
      prisma.product.count({ where }),
    ]);

    const items = lowStockOnly
      ? products.filter((product) => {
          const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
          return totalStock < product.minStock;
        })
      : products;

    return {
      success: true as const,
      data: {
        items,
        total: lowStockOnly ? items.length : total,
        page,
        pageSize,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getProduct(id: string) {
  try {
    await authorizeProducts();
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        variants: true,
        inventoryMovements: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { createdBy: { include: { profile: true } } },
        },
      },
    });

    if (!product) {
      throw new AppError("Producto no encontrado.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: product };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createProduct(input: unknown) {
  try {
    await authorizeProducts();
    const parsed = createProductSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del producto inválidos.", "VALIDATION", 400);
    }

    const { variants, ...data } = parsed.data;
    const product = await prisma.product.create({
      data: {
        ...data,
        variants: {
          create: variants,
        },
      },
      include: { variants: true },
    });

    return { success: true as const, data: product };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateProduct(input: unknown) {
  try {
    await authorizeProducts();
    const parsed = updateProductSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del producto inválidos.", "VALIDATION", 400);
    }

    const { id, variants, ...data } = parsed.data;
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Producto no encontrado.", "NOT_FOUND", 404);
    }

    const product = await prisma.$transaction(async (tx) => {
      if (variants) {
        for (const variant of variants) {
          if (variant.id) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                name: variant.name,
                size: variant.size,
                color: variant.color,
                stock: variant.stock,
                sku: variant.sku,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                name: variant.name,
                size: variant.size,
                color: variant.color,
                stock: variant.stock,
                sku: variant.sku,
              },
            });
          }
        }
      }

      return tx.product.update({
        where: { id },
        data,
        include: { variants: true },
      });
    });

    return { success: true as const, data: product };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProduct(id: string) {
  try {
    await authorizeProducts();
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      throw new AppError("Producto no encontrado.", "NOT_FOUND", 404);
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });

    return { success: true as const, data: { id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getStockAlerts() {
  try {
    await authorizeProducts();
    const products = await prisma.product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: { variants: true },
    });

    const alerts = products.flatMap((product) => {
      if (product.variants.length === 0) {
        return [];
      }

      const lowVariants = getLowStockItems(
        product.variants.map((variant) => ({
          name: `${product.name} - ${variant.name}`,
          stock: variant.stock,
          minStock: product.minStock,
        })),
      );

      return lowVariants.map((variant) => ({
        productId: product.id,
        productName: product.name,
        variantName: variant.name,
        stock: variant.stock,
        minStock: variant.minStock,
      }));
    });

    return { success: true as const, data: alerts };
  } catch (error) {
    return toActionError(error);
  }
}