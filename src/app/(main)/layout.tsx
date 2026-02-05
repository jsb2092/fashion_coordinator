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
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
      {!person.hasCompletedOnboarding && <OnboardingWizardWrapper />}
    </div>
  );
}
