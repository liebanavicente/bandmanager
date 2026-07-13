"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { quickConcertSale } from "@/actions/orders";
import { listProducts } from "@/actions/products";
import { unwrapAction } from "@/lib/action-result";
import { centsToEuros } from "@/lib/money";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ProductOption = {
  id: string;
  name: string;
  priceCents: number;
  variants: { id: string; name: string; stock: number }[];
};

export default function QuickSalePage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listProducts({ pageSize: 50 }).then((result) => {
      const data = unwrapAction(result);
      setProducts(
        data.items.map((p) => ({
          id: p.id,
          name: p.name,
          priceCents: p.priceCents,
          variants: p.variants.map((v) => ({
            id: v.id,
            name: v.name,
            stock: v.stock,
          })),
        })),
      );
    });
  }, []);

  const selected = products.find((p) => p.id === productId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !customerName.trim()) {
      toast.error("Completa los campos obligatorios.");
      return;
    }

    startTransition(async () => {
      const result = await quickConcertSale({
        customerName: customerName.trim(),
        items: [
          {
            productId,
            variantId: variantId || undefined,
            quantity,
          },
        ],
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(`Pedido ${result.data.orderNumber} registrado`);
      setCustomerName("");
      setQuantity(1);
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="Venta rápida"
        description="Registra ventas en concierto desde el móvil."
      >
        <Button variant="outline" size="sm" render={<Link href="/orders" />}>
          <ArrowLeft />
          Pedidos
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Input
                id="customer"
                placeholder="Nombre del comprador"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Producto</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {centsToEuros(p.priceCents)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && selected.variants.length > 0 && (
              <div className="space-y-2">
                <Label>Variante</Label>
                <Select value={variantId} onValueChange={(v) => setVariantId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Talla / color" />
                  </SelectTrigger>
                  <SelectContent>
                    {selected.variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} (stock: {v.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="qty">Cantidad</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              <ShoppingBag />
              {isPending ? "Registrando…" : "Registrar venta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}