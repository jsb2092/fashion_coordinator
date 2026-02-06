import { AppSidebar } from "@/components/layout/AppSidebar";
import { getOrCreatePerson } from "@/lib/actions";
import { OnboardingWizardWrapper } from "@/components/onboarding/OnboardingWizardWrapper";
import { ContentBannerAd } from "@/components/ads/BannerAd";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const person = await getOrCreatePerson();
  const isPro = person.subscriptionTier === "pro" && person.subscriptionStatus === "active";

  return (
    <div className="flex h-screen">
      <AppSidebar subscriptionTier={person.subscriptionTier} />
      <main className={`flex-1 overflow-auto ${!isPro ? "pb-[60px]" : ""}`}>
        {children}
      </main>
      {!isPro && <ContentBannerAd />}
      {!person.hasCompletedOnboarding && <OnboardingWizardWrapper />}
    </div>
  );
}
