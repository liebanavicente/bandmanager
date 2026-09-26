import { notFound } from "next/navigation";
import { getEvent } from "@/actions/events";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/shared/page-header";
import { isActionSuccess } from "@/lib/action-result";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getEvent(id);
  if (!isActionSuccess(result)) notFound();
  const event = result.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={event.title} eyebrow="Editando evento" description="Cambia fecha, sala o estado." />
      <EventForm event={event} />
    </div>
  );
}
