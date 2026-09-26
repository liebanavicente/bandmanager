"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, OrderStatus, PaymentStatus } from "@prisma/client";
import { toast } from "sonner";
import { updateOrder } from "@/actions/orders";
import { EntityActions } from "@/components/shared/entity-actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { OptionSelect } from "@/components/shared/option-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type OrderDraft = Pick<
  Order,
  "id" | "orderNumber" | "customerName" | "customerEmail" | "shippingCents" | "status" | "paymentStatus" | "notes"
>;

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Pagado" },
  { value: "PREPARING", label: "Preparando" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];
const paymentOptions: { value: PaymentStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PAID", label: "Pagado" },
  { value: "REFUNDED", label: "Reembolsado" },
  { value: "FAILED", label: "Fallido" },
];

function OrderDialog({ order, open, onOpenChange }: { order: OrderDraft; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [payment, setPayment] = useState<PaymentStatus>(order.paymentStatus);

  async function handleSubmit(form: FormData) {
    setLoading(true);
    const result = await updateOrder({
      id: order.id,
      customerName: form.get("customerName"),
      customerEmail: form.get("customerEmail") ?? "",
      shippingCents: Math.round(Number(form.get("shipping") || 0) * 100),
      notes: form.get("notes") ?? "",
      status,
      paymentStatus: payment,
    });
    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Pedido actualizado");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      kicker="Editar pedido"
      title={order.orderNumber}
      submitLabel="Guardar cambios"
      loading={loading}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Estado</Label>
          <OptionSelect value={status} onValueChange={setStatus} options={statusOptions} aria-label="Estado" />
        </div>
        <div className="space-y-2">
          <Label>Pago</Label>
          <OptionSelect value={payment} onValueChange={setPayment} options={paymentOptions} aria-label="Pago" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="o-name">Cliente</Label>
          <Input id="o-name" name="customerName" required defaultValue={order.customerName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="o-email">Email</Label>
          <Input id="o-email" name="customerEmail" type="email" defaultValue={order.customerEmail ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="o-shipping">Envío (€)</Label>
          <Input id="o-shipping" name="shipping" type="number" min={0} step="0.01" defaultValue={(order.shippingCents / 100).toFixed(2)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="o-notes">Notas</Label>
        <Textarea id="o-notes" name="notes" rows={2} defaultValue={order.notes ?? ""} />
      </div>
    </FormDialog>
  );
}

export function OrderActions({ order, canManage }: { order: OrderDraft; canManage: boolean }) {
  const [editing, setEditing] = useState(false);
  if (!canManage) return null;
  return (
    <>
      <EntityActions
        entity="order"
        id={order.id}
        name={order.orderNumber}
        onEdit={() => setEditing(true)}
        extraDescription="Si el pedido ya había descontado stock, se devolverá al inventario."
      />
      {editing && <OrderDialog order={order} open={editing} onOpenChange={setEditing} />}
    </>
  );
}
