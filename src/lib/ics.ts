import type { Event } from "@prisma/client";

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) return line;

  const parts: string[] = [line.slice(0, maxLength)];
  let index = maxLength;

  while (index < line.length) {
    parts.push(` ${line.slice(index, index + maxLength - 1)}`);
    index += maxLength - 1;
  }

  return parts.join("\r\n");
}

export type IcsEventInput = Pick<
  Event,
  | "id"
  | "title"
  | "description"
  | "startAt"
  | "endAt"
  | "venue"
  | "address"
  | "mapsUrl"
  | "type"
  | "status"
>;

export function generateEventIcs(event: IcsEventInput, bandName = "BandManager"): string {
  const now = formatIcsDate(new Date());
  const uid = `${event.id}@bandmanager`;
  const location = [event.venue, event.address].filter(Boolean).join(", ");
  const descriptionParts = [
    event.description,
    event.mapsUrl ? `Mapa: ${event.mapsUrl}` : undefined,
    `Tipo: ${event.type}`,
    `Estado: ${event.status}`,
  ].filter(Boolean);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BandManager//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsDate(event.startAt)}`,
    `DTEND:${formatIcsDate(event.endAt)}`,
    foldLine(`SUMMARY:${escapeIcsText(event.title)}`),
    location ? foldLine(`LOCATION:${escapeIcsText(location)}`) : undefined,
    descriptionParts.length > 0
      ? foldLine(`DESCRIPTION:${escapeIcsText(descriptionParts.join("\n"))}`)
      : undefined,
    event.mapsUrl ? `URL:${event.mapsUrl}` : undefined,
    `ORGANIZER;CN=${escapeIcsText(bandName)}:MAILTO:noreply@bandmanager.local`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => Boolean(line));

  return `${lines.join("\r\n")}\r\n`;
}