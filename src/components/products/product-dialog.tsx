"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { Product, ProductStatus, ProductVariant } from "@prisma/client";
import { toast } from "sonner";
import { createProduct, updateProduct } from "@/actions/products";
import { EntityActions } from "@/components/shared/entity-actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProductDraft = Pick<
  Product,
  "id" | "name" | "description" | "category" | "priceCents" | "costCents" | "sku" | "status" | "minStock" | "supplier"
> & { variants: Pick<ProductVariant, "id" | "name" | "size" | "color" | "stock" | "sku">[] };

type VariantRow = {
  key: number;
  id?: string;
  name: string;
  size: string;
  color: string;
  stock: string;
  sku: string;
};

const statusOptions: { value: ProductStatus; label: string }[] = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "DISCONTINUED", label: "Descatalogado" },
];

function euros(cents?: number) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

type ProductDialogProps = {
  product?: ProductDraft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductDialog({ product, open, onOpenChange }: ProductDialogProps) {
  const router = useRouter();
  const nextKey = useRef((product?.variants.length ?? 0) + 1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "ACTIVE");
  const [variants, setVariants] = useState<VariantRow[]>(() =>
    (product?.variants ?? []).map((v, i) => ({
      key: i + 1,
      id: v.id,
      name: v.name,
      size: v.size ?? "",
      color: v.color ?? "",
      stock: String(v.stock),
      sku: v.sku,
    })),
  );

  function patchVariant(key: number, patch: Partial<VariantRow>) {
    setVariants((list) => list.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  async function handleSubmit(form: FormData) {
    const sku = String(form.get("sku") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const payload = {
      name,
      category: String(form.get("category") ?? "").trim(),
      description: String(form.get("description") ?? ""),
      supplier: String(form.get("supplier") ?? ""),
      priceCents: Math.round(Number(form.get("price") || 0) * 100),
      costCents: Math.round(Number(form.get("cost") || 0) * 100),
      minStock: Number(form.get("minStock") || 0),
      sku,
      status,
      variants: variants
        .filter((v) => v.name.trim() || v.size.trim())
        .map((v, i) => ({
          id: v.id,
          name: v.name.trim() || `${name} ${v.size}`.trim(),
          size: v.size,
          color: v.color,
          stock: Number(v.stock || 0),
          sku: v.sku.trim() || `${sku}-${(v.size || String(i + 1)).toUpperCase().replace(/\s+/g, "")}`,
        })),
    };

    setLoading(true);
    const result = product ? await updateProduct({ id: product.id, ...payload }) : await createProduct(payload);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(product ? "Producto actualizado" : "Producto creado");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      kicker={product ? "Editar producto" : "Nuevo producto"}
      title={product ? product.name : "Merch nuevo"}
      submitLabel={product ? "Guardar cambios" : "Crear producto"}
      loading={loading}
      onSubmit={handleSubmit}
      className="sm:max-w-2xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-name">Nombre</Label>
          <Input id="p-name" name="name" required defaultValue={product?.name} placeholder="Camiseta logo" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-category">Categoría</Label>
          <Input id="p-category" name="category" required defaultValue={product?.category ?? "Merch"} list="p-categories" />
          <datalist id="p-categories">
            {["Camisetas", "Sudaderas", "Discos", "Pósteres", "Pegatinas", "Accesorios"].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-sku">SKU</Label>
          <Input id="p-sku" name="sku" required defaultValue={product?.sku} placeholder="BM-TSH-001" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-price">Precio (€)</Label>
          <Input id="p-price" name="price" type="number" min={0} step="0.01" required defaultValue={euros(product?.priceCents)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-cost">Coste (€)</Label>
          <Input id="p-cost" name="cost" type="number" min={0} step="0.01" defaultValue={euros(product?.costCents) || "0"} />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <OptionSelect value={status} onValueChange={setStatus} options={statusOptions} aria-label="Estado" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-min">Stock mínimo</Label>
          <Input id="p-min" name="minStock" type="number" min={0} defaultValue={product?.minStock ?? 5} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-supplier">Proveedor</Label>
          <Input id="p-supplier" name="supplier" defaultValue={product?.supplier ?? ""} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-description">Descripción</Label>
          <Textarea id="p-description" name="description" rows={2} defaultValue={product?.description ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Variantes y stock</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setVariants((list) => [
                ...list,
                { key: nextKey.current++, name: "", size: "", color: "", stock: "0", sku: "" },
              ])
            }
          >
            <Plus />
            Variante
          </Button>
        </div>
        {variants.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            Sin variantes. Añade tallas o colores para controlar stock.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_4.5rem_5rem_4.5rem_2rem] gap-2 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:grid">
              <span>Nombre</span>
              <span>Talla</span>
              <span>Color</span>
              <span>Stock</span>
              <span />
            </div>
            {variants.map((v, i) => (
              <div key={v.key} className="grid grid-cols-[1fr_4.5rem_5rem_4.5rem_2rem] items-center gap-2">
                <Input value={v.name} onChange={(e) => patchVariant(v.key, { name: e.target.value })} placeholder="Negro" aria-label={`Nombre variante ${i + 1}`} />
                <Input value={v.size} onChange={(e) => patchVariant(v.key, { size: e.target.value })} placeholder="M" aria-label={`Talla variante ${i + 1}`} />
                <Input value={v.color} onChange={(e) => patchVariant(v.key, { color: e.target.value })} placeholder="Negro" aria-label={`Color variante ${i + 1}`} />
                <Input type="number" min={0} value={v.stock} onChange={(e) => patchVariant(v.key, { stock: e.target.value })} aria-label={`Stock variante ${i + 1}`} />
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Quitar variante ${i + 1}`} onClick={() => setVariants((list) => list.filter((x) => x.key !== v.key))}>
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormDialog>
  );
}

export function NewProductButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Nuevo producto
      </Button>
      {open && <ProductDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}

export function ProductActions({ product }: { product: ProductDraft }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <EntityActions entity="product" id={product.id} name={product.name} onEdit={() => setEditing(true)} />
      {editing && <ProductDialog product={product} open={editing} onOpenChange={setEditing} />}
    </>
  );
}
