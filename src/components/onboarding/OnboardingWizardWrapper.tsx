"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "./OnboardingWizard";

export function OnboardingWizardWrapper() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    router.refresh();
  };

  if (!isOpen) return null;

  return <OnboardingWizard onClose={handleClose} />;
}
