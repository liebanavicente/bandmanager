import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBand, type BandLinks } from "@/lib/workspace";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monta tu banda",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const band = await getBand();

  return (
    <OnboardingWizard
      adminName={session.user.name.split(" ")[0]}
      rerun={Boolean(band?.onboardedAt)}
      initial={{
        name: band?.name ?? "",
        logoData: band?.logoData ?? "",
        genre: band?.genre ?? "",
        city: band?.city ?? "",
        foundedYear: band?.foundedYear ? String(band.foundedYear) : "",
        bio: band?.bio ?? "",
        hasStore: band?.hasStore ?? null,
        storeUrl: band?.storeUrl ?? "",
        links: (band?.links as BandLinks | null) ?? {},
      }}
    />
  );
}
