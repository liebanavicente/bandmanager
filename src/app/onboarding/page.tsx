import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOptionalSessionUser } from "@/lib/session";
import { getBand, type BandLinks } from "@/lib/workspace";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monta tu banda",
};

export default async function OnboardingPage() {
  const user = await getOptionalSessionUser();
  if (!user) redirect("/salir");
  if (user.role !== "ADMIN") redirect("/");

  const band = await getBand(user.bandId);

  return (
    <OnboardingWizard
      adminName={user.name.split(" ")[0]}
      rerun={Boolean(band?.onboardedAt)}
      initial={{
        name: band?.onboardedAt ? band.name : "",
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
