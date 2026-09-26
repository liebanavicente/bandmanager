import { redirect } from "next/navigation";

/** Enlace de invitación compartible: /join/VOLT-7K2Q → registro con el código puesto. */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/register?code=${encodeURIComponent(code)}`);
}
