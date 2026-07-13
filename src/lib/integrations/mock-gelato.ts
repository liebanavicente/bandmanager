import type {
  IPrintOnDemandProvider,
  PrintOrderInput,
  PrintOrderResult,
} from "@/lib/integrations/types";

const submittedOrders = new Map<string, PrintOrderResult>();

export class MockGelatoProvider implements IPrintOnDemandProvider {
  readonly name = "Gelato (mock)";

  async submitOrder(input: PrintOrderInput): Promise<PrintOrderResult> {
    await this.simulateLatency();

    const externalId = `gelato-${input.orderNumber.toLowerCase()}`;
    const result: PrintOrderResult = {
      externalId,
      status: "submitted",
      trackingUrl: `https://mock.gelato.com/orders/${externalId}`,
    };

    submittedOrders.set(externalId, result);
    return result;
  }

  async getOrderStatus(externalId: string): Promise<PrintOrderResult> {
    await this.simulateLatency();

    const existing = submittedOrders.get(externalId);
    if (!existing) {
      throw new Error(`Pedido Gelato no encontrado: ${externalId}`);
    }

    return {
      ...existing,
      status: "processing",
    };
  }

  private async simulateLatency(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

export const mockGelatoProvider = new MockGelatoProvider();