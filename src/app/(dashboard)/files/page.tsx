import { Suspense } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, FileIcon, FolderOpen } from "lucide-react";
import type { FileCategory } from "@prisma/client";
import { listFiles } from "@/actions/files";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilters } from "@/components/shared/search-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isActionSuccess } from "@/lib/action-result";
import { fileCategoryLabels } from "@/lib/file-categories";
import { bandStoragePrefix, getMaxFileSizeBytes, isBlobStorage } from "@/lib/files";
import { getSessionUser } from "@/lib/session";
import { FileActions, UploadFileButton } from "@/components/files/file-dialog";
import { ListPanel, ListRow } from "@/components/shared/list-panel";

const categoryLabels = fileCategoryLabels;

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
    <ListPanel>
      {files.map((file) => (
        <ListRow
          key={file.id}
          leading={
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-band text-band-ink ring-1 ring-ink/10">
              <FileIcon className="size-5" />
            </span>
          }
          title={file.name}
          badges={<Badge variant="outline">{categoryLabels[file.category]}</Badge>}
          meta={
            <>
              {file.description && <p>{file.description}</p>}
              <p className="text-xs">
                {formatFileSize(file.sizeBytes)} · {file.uploadedBy.profile?.name ?? file.uploadedBy.email} ·{" "}
                {format(file.createdAt, "d MMM yyyy", { locale: es })}
                {file.event && ` · ${file.event.title}`}
              </p>
            </>
          }
          actions={
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Descargar ${file.name}`}
                nativeButton={false}
                render={<a href={`/api/files/${file.id}`} download />}
              >
                <Download />
              </Button>
              <FileActions file={file} />
            </>
          }
        />
      ))}
    </ListPanel>
  );
}

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: FileCategory }>;
}) {
  const user = await getSessionUser();
  const directUpload = isBlobStorage()
    ? { prefix: bandStoragePrefix(user.bandId), maxBytes: getMaxFileSizeBytes() }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Archivos" description="Documentación compartida de la banda.">
        <UploadFileButton directUpload={directUpload} />
      </PageHeader>

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