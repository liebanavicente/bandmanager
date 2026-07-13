import { Suspense } from "react";
import { Package } from "lucide-react";
import type { ProductStatus } from "@prisma/client";
import { listProducts } from "@/actions/products";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { centsToEuros, calculateMarginPercent } from "@/lib/money";

const productStatusOptions = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "DISCONTINUED", label: "Descatalogado" },
];

async function ProductsList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: ProductStatus }>;
}) {
  const params = await searchParams;
  const result = await listProducts({
    search: params.q,
    status: params.status,
  });

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const products = result.data.items;

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Sin productos"
        description="Gestiona camisetas, vinilos y merch de la banda."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        const margin = calculateMarginPercent(product.priceCents, product.costCents);

        return (
          <Card key={product.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{product.name}</h3>
                <StatusBadge kind="product" status={product.status} />
              </div>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-semibold">
                  {centsToEuros(product.priceCents)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Margen {margin}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                SKU {product.sku} · Stock {totalStock} · {product.variants.length} variantes
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: ProductStatus }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Catálogo de merchandising e inventario."
      />

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <SearchFilters
          searchPlaceholder="Buscar por nombre o SKU…"
          statusOptions={productStatusOptions}
        />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ProductsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}