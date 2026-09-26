import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listSongsForImport } from "@/actions/songs";
import { LyricsImporter } from "@/components/songs/lyrics-importer";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { isActionSuccess } from "@/lib/action-result";

export const metadata: Metadata = {
  title: "Importar letras",
};

export default async function ImportLyricsPage() {
  const result = await listSongsForImport();
  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar letras"
        eyebrow="Canciones"
        description="Sube las letras y las asignamos a cada canción, con su tonalidad."
      >
        <Button variant="ghost" nativeButton={false} render={<Link href="/songs" />}>
          <ArrowLeft />
          Volver
        </Button>
      </PageHeader>
      <LyricsImporter songs={result.data} />
    </div>
  );
}
