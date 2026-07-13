import type { OrderStatus, ProductStatus } from "@prisma/client";

export type ExternalProduct = {
  externalId: string;
  name: string;
  description?: string;
  category: string;
  priceCents: number;
  costCents: number;
  sku: string;
  status: ProductStatus;
  imageUrls: string[];
  variants: ExternalProductVariant[];
};

export type ExternalProductVariant = {
  externalId: string;
  name: string;
  size?: string;
  color?: string;
  stock: number;
  sku: string;
};

export type ExternalOrder = {
  externalId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  items: ExternalOrderItem[];
};

export type ExternalOrderItem = {
  externalProductId: string;
  externalVariantId?: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
};

export type PrintOrderInput = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  shippingAddress?: string;
  items: {
    sku: string;
    quantity: number;
    productName: string;
  }[];
};

export type PrintOrderResult = {
  externalId: string;
  status: "submitted" | "processing" | "failed";
  trackingUrl?: string;
};

export interface IEcommerceProvider {
  readonly name: string;
  fetchProducts(): Promise<ExternalProduct[]>;
  fetchOrders(since?: Date): Promise<ExternalOrder[]>;
  pushProductStock(
    externalProductId: string,
    externalVariantId: string | undefined,
    stock: number,
  ): Promise<void>;
}

export interface IPrintOnDemandProvider {
  readonly name: string;
  submitOrder(input: PrintOrderInput): Promise<PrintOrderResult>;
  getOrderStatus(externalId: string): Promise<PrintOrderResult>;
}

export type SyncResult = {
  provider: string;
  action: string;
  success: boolean;
  processed: number;
  error?: string;
};