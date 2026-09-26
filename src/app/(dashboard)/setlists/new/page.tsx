import type { Metadata } from "next";
import { listSetlistChoices } from "@/actions/setlists";
import { SetlistBuilder } from "@/components/music/setlist-builder";
import { isActionSuccess } from "@/lib/action-result";

export const metadata: Metadata = {
  title: "Nuevo setlist",
};

export default async function NewSetlistPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const [{ event }, result] = await Promise.all([searchParams, listSetlistChoices()]);
  if (!isActionSuccess(result)) {
    return <p className="text-sm text-destructive">{result.error}</p>;
  }
  const { songs, events, repertoires } = result.data;
  const defaultEventId = events.some((e) => e.id === event) ? event : undefined;

  return <SetlistBuilder songs={songs} events={events} repertoires={repertoires} defaultEventId={defaultEventId} />;
}
