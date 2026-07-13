import { redirect } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/shared/page-header";
import { auth } from "@/lib/auth";

export default async function NewEventPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/events");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nuevo evento"
        description="Programa un concierto, ensayo o actividad."
      />
      <EventForm />
    </div>
  );
}