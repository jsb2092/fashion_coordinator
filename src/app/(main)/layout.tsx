import { AppSidebar } from "@/components/layout/AppSidebar";
import { getOrCreatePerson } from "@/lib/actions";
import { OnboardingWizardWrapper } from "@/components/onboarding/OnboardingWizardWrapper";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const person = await getOrCreatePerson();

  return (
    <div className="flex h-screen">
      <AppSidebar subscriptionTier={person.subscriptionTier} />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
      {!person.hasCompletedOnboarding && <OnboardingWizardWrapper />}
    </div>
  );
}
