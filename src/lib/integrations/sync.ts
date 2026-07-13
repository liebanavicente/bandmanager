import { Prisma, SyncProvider, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mockWooCommerceProvider } from "@/lib/integrations/mock-ecommerce";
import { mockGelatoProvider } from "@/lib/integrations/mock-gelato";
import type { SyncResult } from "@/lib/integrations/types";

async function logSync(
  provider: SyncProvider,
  action: string,
  status: SyncStatus,
  payload?: Prisma.InputJsonValue,
  error?: string,
) {
  await prisma.syncLog.create({
    data: {
      provider,
      action,
      status,
      payload,
      error,
    },
  });
}

export async function syncWooCommerceProducts(): Promise<SyncResult> {
  const action = "import_products";

  try {
    const externalProducts = await mockWooCommerceProvider.fetchProducts();
    let processed = 0;

    for (const external of externalProducts) {
      const product = await prisma.product.upsert({
        where: { sku: external.sku },
        create: {
          name: external.name,
          description: external.description,
          category: external.category,
          imagePaths: external.imageUrls,
          priceCents: external.priceCents,
          costCents: external.costCents,
          sku: external.sku,
          status: external.status,
          externalId: external.externalId,
          variants: {
            create: external.variants.map((variant) => ({
              name: variant.name,
              size: variant.size,
              color: variant.color,
              stock: variant.stock,
              sku: variant.sku,
            })),
          },
        },
        update: {
          name: external.name,
          description: external.description,
          category: external.category,
          imagePaths: external.imageUrls,
          priceCents: external.priceCents,
          costCents: external.costCents,
          status: external.status,
          externalId: external.externalId,
        },
      });

      for (const variant of external.variants) {
        await prisma.productVariant.upsert({
          where: { sku: variant.sku },
          create: {
            productId: product.id,
            name: variant.name,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            sku: variant.sku,
          },
          update: {
            name: variant.name,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
          },
        });
      }

      processed += 1;
    }

    await logSync(SyncProvider.WOOCOMMERCE, action, SyncStatus.SUCCESS, {
      processed,
    });

    return {
      provider: mockWooCommerceProvider.name,
      action,
      success: true,
      processed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await logSync(SyncProvider.WOOCOMMERCE, action, SyncStatus.FAILED, undefined, message);
    return {
      provider: mockWooCommerceProvider.name,
      action,
      success: false,
      processed: 0,
      error: message,
    };
  }
}

export async function syncWooCommerceOrders(): Promise<SyncResult> {
  const action = "import_orders";

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const externalOrders = await mockWooCommerceProvider.fetchOrders(since);
    let processed = 0;

    for (const external of externalOrders) {
      const existing = await prisma.order.findFirst({
        where: { orderNumber: external.orderNumber },
      });

      if (existing) continue;

      const items = [];
      for (const item of external.items) {
        const product = await prisma.product.findFirst({
          where: {
            OR: [{ externalId: item.externalProductId }, { sku: item.sku }],
          },
          include: { variants: true },
        });

        if (!product) continue;

        const variant = item.externalVariantId
          ? product.variants.find((v) => v.sku === item.sku)
          : undefined;

        items.push({
          productId: product.id,
          variantId: variant?.id,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        });
      }

      if (items.length === 0) continue;

      const subtotalCents = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceCents,
        0,
      );

      await prisma.order.create({
        data: {
          orderNumber: external.orderNumber,
          customerName: external.customerName,
          customerEmail: external.customerEmail,
          subtotalCents,
          totalCents: external.totalCents,
          status: external.status,
          paymentStatus: "PAID",
          channel: "WEB",
          items: { create: items },
        },
      });

      processed += 1;
    }

    await logSync(SyncProvider.WOOCOMMERCE, action, SyncStatus.SUCCESS, {
      processed,
    });

    return {
      provider: mockWooCommerceProvider.name,
      action,
      success: true,
      processed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await logSync(SyncProvider.WOOCOMMERCE, action, SyncStatus.FAILED, undefined, message);
    return {
      provider: mockWooCommerceProvider.name,
      action,
      success: false,
      processed: 0,
      error: message,
    };
  }
}

export async function syncGelatoPendingOrders(): Promise<SyncResult> {
  const action = "submit_print_orders";

  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: { in: ["PAID", "PREPARING"] },
        channel: "WEB",
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      take: 20,
    });

    let processed = 0;

    for (const order of pendingOrders) {
      const result = await mockGelatoProvider.submitOrder({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        items: order.items.map((item) => ({
          sku: item.variant?.sku ?? item.product.sku,
          quantity: item.quantity,
          productName: item.product.name,
        })),
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PREPARING",
          notes: [order.notes, `Gelato: ${result.externalId}`].filter(Boolean).join("\n"),
        },
      });

      processed += 1;
    }

    await logSync(SyncProvider.GELATO, action, SyncStatus.SUCCESS, {
      processed,
    });

    return {
      provider: mockGelatoProvider.name,
      action,
      success: true,
      processed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await logSync(SyncProvider.GELATO, action, SyncStatus.FAILED, undefined, message);
    return {
      provider: mockGelatoProvider.name,
      action,
      success: false,
      processed: 0,
      error: message,
    };
  }
}

export async function runIntegrationSync(
  provider: "WOOCOMMERCE" | "GELATO" | "ALL" = "ALL",
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  if (provider === "WOOCOMMERCE" || provider === "ALL") {
    results.push(await syncWooCommerceProducts());
    results.push(await syncWooCommerceOrders());
  }

  if (provider === "GELATO" || provider === "ALL") {
    results.push(await syncGelatoPendingOrders());
  }

  return results;
}