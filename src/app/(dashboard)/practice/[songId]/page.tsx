import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPracticeSong } from "@/actions/practice";
import { PracticeSession } from "@/components/practice/practice-session";
import { isActionSuccess } from "@/lib/action-result";

export const metadata: Metadata = {
  title: "Ensayar letra",
};

export default async function PracticeSongPage({
  params,
  searchParams,
}: {
  params: Promise<{ songId: string }>;
  searchParams: Promise<{ queue?: string }>;
}) {
  const [{ songId }, { queue }] = await Promise.all([params, searchParams]);
  const result = await getPracticeSong(songId);
  if (!isActionSuccess(result)) notFound();
  const song = result.data;

  return (
    <PracticeSession
      key={song.id}
      song={{ ...song, lyrics: song.lyrics ?? "" }}
      queue={(queue ?? "").split(",").filter(Boolean).slice(0, 50)}
    />
  );
}
