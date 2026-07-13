"use server";

import { prisma } from "@/lib/prisma";
import { AppError, toActionError } from "@/lib/errors";
import { getCollaboratorAreas, getSessionUser } from "@/lib/session";
import { canManage, requirePermission } from "@/lib/permissions";
import { calculateOrderTotal } from "@/lib/money";
import { adjustStock } from "@/lib/stock";
import {
  createOrderSchema,
  orderFiltersSchema,
  quickConcertSaleSchema,
  updateOrderSchema,
} from "@/lib/validations";

async function authorizeOrders() {
  const user = await getSessionUser();
  const areas =
    user.role === "COLLABORATOR" ? await getCollaboratorAreas(user.id) : undefined;
  requirePermission(user.role, "orders", areas);
  return user;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BM-${timestamp}-${random}`;
}

async function resolveOrderItems(
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
    unitPriceCents?: number;
  }[],
) {
  const resolved = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, deletedAt: null },
      include: { variants: true },
    });

    if (!product) {
      throw new AppError("Producto no encontrado.", "NOT_FOUND", 404);
    }

    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : product.variants[0];

    if (item.variantId && !variant) {
      throw new AppError("Variante no encontrada.", "NOT_FOUND", 404);
    }

    resolved.push({
      productId: product.id,
      variantId: variant?.id,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents ?? product.priceCents,
    });
  }

  return resolved;
}

async function deductStockForOrder(
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[],
  userId: string,
  reason: string,
) {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant) {
          throw new AppError("Variante no encontrada.", "NOT_FOUND", 404);
        }

        const nextStock = adjustStock(variant.stock, -item.quantity);
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: nextStock },
        });
      }

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          quantity: -item.quantity,
          reason,
          createdById: userId,
        },
      });
    }
  });
}

export async function listOrders(input: unknown = {}) {
  try {
    await authorizeOrders();
    const parsed = orderFiltersSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Filtros inválidos.", "VALIDATION", 400);
    }

    const { page, pageSize, search, status, paymentStatus, channel } = parsed.data;
    const where = {
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" as const } },
              { customerName: { contains: search, mode: "insensitive" as const } },
              { customerEmail: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(channel ? { channel } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
            include: { product: true, variant: true },
          },
          createdBy: { include: { profile: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { success: true as const, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getOrder(id: string) {
  try {
    await authorizeOrders();
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        createdBy: { include: { profile: true } },
      },
    });

    if (!order) {
      throw new AppError("Pedido no encontrado.", "NOT_FOUND", 404);
    }

    return { success: true as const, data: order };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createOrder(input: unknown) {
  try {
    const user = await authorizeOrders();
    const parsed = createOrderSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del pedido inválidos.", "VALIDATION", 400);
    }

    const resolvedItems = await resolveOrderItems(parsed.data.items);
    const totals = calculateOrderTotal(resolvedItems, parsed.data.shippingCents);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail || null,
        subtotalCents: totals.subtotalCents,
        shippingCents: parsed.data.shippingCents,
        totalCents: totals.totalCents,
        paymentStatus: parsed.data.paymentStatus,
        status: parsed.data.status,
        channel: parsed.data.channel,
        notes: parsed.data.notes,
        createdById: user.id,
        items: { create: resolvedItems },
      },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    return { success: true as const, data: order };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateOrder(input: unknown) {
  try {
    const user = await authorizeOrders();
    if (!canManage(user.role, "orders")) {
      throw new AppError("No tienes permisos para editar pedidos.", "FORBIDDEN", 403);
    }

    const parsed = updateOrderSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos del pedido inválidos.", "VALIDATION", 400);
    }

    const { id, customerEmail, ...data } = parsed.data;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Pedido no encontrado.", "NOT_FOUND", 404);
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...data,
        ...(customerEmail !== undefined ? { customerEmail: customerEmail || null } : {}),
      },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    return { success: true as const, data: order };
  } catch (error) {
    return toActionError(error);
  }
}

export async function quickConcertSale(input: unknown) {
  try {
    const user = await authorizeOrders();
    const parsed = quickConcertSaleSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("Datos de venta inválidos.", "VALIDATION", 400);
    }

    const resolvedItems = await resolveOrderItems(parsed.data.items);
    const totals = calculateOrderTotal(resolvedItems, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: parsed.data.customerName,
        subtotalCents: totals.subtotalCents,
        totalCents: totals.totalCents,
        paymentStatus: "PAID",
        status: "DELIVERED",
        channel: "CONCERT",
        notes: parsed.data.notes,
        createdById: user.id,
        items: { create: resolvedItems },
      },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    await deductStockForOrder(
      resolvedItems,
      user.id,
      `Venta en concierto ${order.orderNumber}`,
    );

    return { success: true as const, data: order };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateOrderStock(orderId: string) {
  try {
    const user = await authorizeOrders();
    if (!canManage(user.role, "orders")) {
      throw new AppError("No tienes permisos para actualizar stock.", "FORBIDDEN", 403);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError("Pedido no encontrado.", "NOT_FOUND", 404);
    }

    if (order.paymentStatus !== "PAID") {
      throw new AppError("El pedido debe estar pagado para descontar stock.", "VALIDATION", 400);
    }

    const existingMovement = await prisma.inventoryMovement.findFirst({
      where: {
        reason: { contains: order.orderNumber },
      },
    });

    if (existingMovement) {
      throw new AppError("El stock ya fue actualizado para este pedido.", "VALIDATION", 400);
    }

    await deductStockForOrder(
      order.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        quantity: item.quantity,
      })),
      user.id,
      `Pedido ${order.orderNumber}`,
    );

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PREPARING" },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });

    return { success: true as const, data: updated };
  } catch (error) {
    return toActionError(error);
  }
}