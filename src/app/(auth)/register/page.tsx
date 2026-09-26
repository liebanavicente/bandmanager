import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { lookupInvite } from "@/actions/band";
import { auth } from "@/lib/auth";
import { isActionSuccess } from "@/lib/action-result";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Entra en tu sala",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; join?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { code, join } = await searchParams;
  const invite = code ? await lookupInvite(code) : null;

  return (
    <RegisterForm
      initialCode={code ?? ""}
      startJoining={Boolean(code) || join === "1"}
      invitedBand={invite && isActionSuccess(invite) ? invite.data : null}
    />
  );
}
