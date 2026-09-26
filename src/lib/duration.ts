export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function sumDurations(durations: (number | null | undefined)[]): number {
  return durations.reduce<number>((sum, d) => sum + (d ?? 0), 0);
}

export function formatTotalDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
/** Duración de un setlist: canciones con la suya y pausas con la prevista. */
export function setlistSeconds(
  items: { type: string; durationSeconds?: number | null; song?: { durationSeconds: number | null } | null }[],
): number {
  return sumDurations(
    items.map((item) => (item.type === "SONG" ? item.song?.durationSeconds : item.durationSeconds)),
  );
}

/** Lo que se teclea en una pausa: "2" son 2 minutos, "1:30" minuto y medio. */
export function parseDurationInput(value: string): number | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const match = /^(\d{1,3})(?::(\d{1,2}))?$/.exec(text);
  if (!match) return undefined;
  const seconds = Number(match[1]) * 60 + Number(match[2] ?? 0);
  return Math.min(seconds, 3600);
}
