import { notFound } from "next/navigation";
import { getSong } from "@/actions/songs";
import { PageHeader } from "@/components/shared/page-header";
import { SongForm } from "@/components/songs/song-form";
import { isActionSuccess } from "@/lib/action-result";

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSong(id);
  if (!isActionSuccess(result)) notFound();
  const song = result.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={song.title} eyebrow="Editando canción" description="Ajusta la ficha del tema." />
      <SongForm song={song} />
    </div>
  );
}
