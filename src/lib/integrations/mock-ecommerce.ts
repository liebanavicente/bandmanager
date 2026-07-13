import { ProductStatus } from "@prisma/client";
import type {
  ExternalOrder,
  ExternalProduct,
  IEcommerceProvider,
} from "@/lib/integrations/types";

const mockProducts: ExternalProduct[] = [
  {
    externalId: "wc-1001",
    name: "Camiseta Logo Banda",
    description: "Camiseta negra con logo frontal.",
    category: "Merchandising",
    priceCents: 2500,
    costCents: 900,
    sku: "WC-TSHIRT-LOGO",
    status: ProductStatus.ACTIVE,
    imageUrls: ["/mock/tshirt.jpg"],
    variants: [
      {
        externalId: "wc-1001-s",
        name: "Talla S",
        size: "S",
        stock: 12,
        sku: "WC-TSHIRT-LOGO-S",
      },
      {
        externalId: "wc-1001-m",
        name: "Talla M",
        size: "M",
        stock: 8,
        sku: "WC-TSHIRT-LOGO-M",
      },
    ],
  },
  {
    externalId: "wc-1002",
    name: "Vinilo Edición Limitada",
    description: "Vinilo negro 12 pulgadas.",
    category: "Música",
    priceCents: 2800,
    costCents: 1200,
    sku: "WC-VINYL-LTD",
    status: ProductStatus.ACTIVE,
    imageUrls: ["/mock/vinyl.jpg"],
    variants: [
      {
        externalId: "wc-1002-std",
        name: "Estándar",
        stock: 25,
        sku: "WC-VINYL-LTD-STD",
      },
    ],
  },
];

const mockOrders: ExternalOrder[] = [
  {
    externalId: "wc-order-501",
    orderNumber: "WC-501",
    customerName: "Laura Gómez",
    customerEmail: "laura@example.com",
    status: "PAID",
    totalCents: 5000,
    createdAt: new Date().toISOString(),
    items: [
      {
        externalProductId: "wc-1001",
        externalVariantId: "wc-1001-m",
        sku: "WC-TSHIRT-LOGO-M",
        quantity: 2,
        unitPriceCents: 2500,
      },
    ],
  },
];

export class MockWooCommerceProvider implements IEcommerceProvider {
  readonly name = "WooCommerce (mock)";

  async fetchProducts(): Promise<ExternalProduct[]> {
    await this.simulateLatency();
    return structuredClone(mockProducts);
  }

  async fetchOrders(since?: Date): Promise<ExternalOrder[]> {
    await this.simulateLatency();
    if (!since) return structuredClone(mockOrders);
    return mockOrders.filter((order) => new Date(order.createdAt) >= since);
  }

  async pushProductStock(
    externalProductId: string,
    externalVariantId: string | undefined,
    stock: number,
  ): Promise<void> {
    await this.simulateLatency();

    const product = mockProducts.find((item) => item.externalId === externalProductId);
    if (!product) {
      throw new Error(`Producto externo no encontrado: ${externalProductId}`);
    }

    if (externalVariantId) {
      const variant = product.variants.find((item) => item.externalId === externalVariantId);
      if (!variant) {
        throw new Error(`Variante externa no encontrada: ${externalVariantId}`);
      }
      variant.stock = stock;
      return;
    }

    if (product.variants[0]) {
      product.variants[0].stock = stock;
    }
  }

  private async simulateLatency(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

export const mockWooCommerceProvider = new MockWooCommerceProvider();