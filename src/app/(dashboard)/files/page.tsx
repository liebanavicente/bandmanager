import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileIcon, FolderOpen } from "lucide-react";
import type { FileCategory } from "@prisma/client";
import { listFiles } from "@/actions/files";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";

const categoryLabels: Record<FileCategory, string> = {
  CONTRACT: "Contrato",
  TECH_RIDER: "Rider técnico",
  HOSPITALITY_RIDER: "Rider hospitality",
  POSTER: "Cartel",
  PHOTO: "Foto",
  INVOICE: "Factura",
  LYRICS: "Letra",
  SHEET_MUSIC: "Partitura",
  AUDIO: "Audio",
  INTERNAL: "Interno",
  OTHER: "Otro",
};

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({
  value,
  label,
}));

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function FilesList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: FileCategory }>;
}) {
  const params = await searchParams;
  const result = await listFiles({
    search: params.q,
    category: params.category,
  });

  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  const files = result.data.items;

  if (files.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Sin archivos"
        description="Sube riders, contratos, partituras y material promo."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {files.map((file) => (
        <Card key={file.id}>
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{file.name}</h3>
                <Badge variant="secondary">{categoryLabels[file.category]}</Badge>
              </div>
              {file.description && (
                <p className="text-sm text-muted-foreground">{file.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatFileSize(file.sizeBytes)} ·{" "}
                {file.uploadedBy.profile?.name ?? file.uploadedBy.email} ·{" "}
                {format(file.createdAt, "d MMM yyyy", { locale: es })}
                {file.event && ` · ${file.event.title}`}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: FileCategory }>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Archivos"
        description="Documentación compartida de la banda."
      />

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <SearchFilters
          searchPlaceholder="Buscar archivos…"
          statusOptions={categoryOptions}
          statusParam="category"
        />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <FilesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}