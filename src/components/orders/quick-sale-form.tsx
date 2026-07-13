"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { quickConcertSale } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centsToEuros } from "@/lib/money";

type ProductForSale = {
  id: string;
  name: string;
  priceCents: number;
  variants: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
};

type CartItem = {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
};

export function QuickSaleForm({ products }: { products: ProductForSale[] }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const totalCents = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0),
    [cart],
  );

  function addToCart(product: ProductForSale, variantId?: string) {
    const variant = product.variants.find((v) => v.id === variantId);
    const name = variant ? `${product.name} (${variant.name})` : product.name;

    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id && item.variantId === variantId,
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id && item.variantId === variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId,
          name,
          quantity: 1,
          unitPriceCents: product.priceCents,
        },
      ];
    });
  }

  function updateQuantity(
    productId: string,
    variantId: string | undefined,
    delta: number,
  ) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.variantId === variantId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function handleSubmit() {
    if (!customerName.trim()) {
      toast.error("Indica el nombre del cliente");
      return;
    }
    if (cart.length === 0) {
      toast.error("Añade al menos un producto");
      return;
    }

    setLoading(true);
    const result = await quickConcertSale({
      customerName: customerName.trim(),
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
    });
    setLoading(false);

    if (!("success" in result) || !result.success) {
      toast.error("error" in result ? result.error : "Error al registrar venta");
      return;
    }

    toast.success(`Pedido ${result.data.orderNumber} registrado`);
    router.push("/orders");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-medium">Productos</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay productos activos con stock.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <Card key={product.id} size="sm">
                <CardHeader>
                  <CardTitle className="text-sm">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold">{centsToEuros(product.priceCents)}</p>
                  {product.variants.length > 0 ? (
                    product.variants.map((variant) => (
                      <Button
                        key={variant.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between"
                        onClick={() => addToCart(product, variant.id)}
                      >
                        <span>{variant.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Stock {variant.stock}
                        </span>
                      </Button>
                    ))
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => addToCart(product)}
                    >
                      Añadir
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="size-4" />
            Carrito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente</Label>
            <Input
              id="customer"
              placeholder="Nombre del comprador"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Carrito vacío</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId ?? "x"}`}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {centsToEuros(item.unitPriceCents)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() =>
                        updateQuantity(item.productId, item.variantId, -1)
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() =>
                        updateQuantity(item.productId, item.variantId, 1)
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">{centsToEuros(totalCents)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={loading || cart.length === 0}
            onClick={handleSubmit}
          >
            {loading && <Loader2 className="animate-spin" />}
            Cobrar y registrar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}