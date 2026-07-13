import { SongForm } from "@/components/songs/song-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewSongPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nueva canción"
        description="Registra un tema en el catálogo."
      />
      <SongForm />
    </div>
  );
}