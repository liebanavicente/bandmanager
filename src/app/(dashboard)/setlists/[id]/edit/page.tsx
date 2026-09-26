import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSetlist, listSetlistChoices } from "@/actions/setlists";
import { SetlistBuilder } from "@/components/music/setlist-builder";
import { isActionSuccess } from "@/lib/action-result";

export const metadata: Metadata = {
  title: "Editar setlist",
};

export default async function EditSetlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, choicesResult] = await Promise.all([getSetlist(id), listSetlistChoices()]);
  if (!isActionSuccess(result)) notFound();
  if (!isActionSuccess(choicesResult)) {
    return <p className="text-sm text-destructive">{choicesResult.error}</p>;
  }
  const setlist = result.data;
  const { songs, events, repertoires } = choicesResult.data;

  return (
    <SetlistBuilder
      songs={songs}
      events={events}
      repertoires={repertoires}
      setlist={{
        id: setlist.id,
        name: setlist.name,
        notes: setlist.notes,
        eventId: setlist.eventId,
        repertoireId: setlist.repertoireId,
        items: setlist.items.map((item) => ({
          type: item.type,
          songId: item.songId,
          comment: item.comment,
          durationSeconds: item.durationSeconds,
        })),
      }}
    />
  );
}
