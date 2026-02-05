"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getOrCreatePerson } from "@/lib/actions";
import { InterestId } from "./config";

export interface OnboardingData {
  interests: InterestId[];
  preferences?: {
    preferredColors?: string[];
    preferredStyle?: string;
  };
  firstItemId?: string;
}

export async function completeOnboarding(data: OnboardingData) {
  const person = await getOrCreatePerson();

  const existingPrefs = (person.preferences as Record<string, unknown>) || {};

  await prisma.person.update({
    where: { id: person.id },
    data: {
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date(),
      preferences: {
        ...existingPrefs,
        primaryInterests: data.interests,
        preferredColors: data.preferences?.preferredColors,
        preferredStyle: data.preferences?.preferredStyle,
        firstItemId: data.firstItemId,
        onboardingVersion: 1,
      },
    },
  });

  revalidatePath("/");
}

export async function skipOnboarding(partialData?: Partial<OnboardingData>) {
  const person = await getOrCreatePerson();

  const existingPrefs = (person.preferences as Record<string, unknown>) || {};

  await prisma.person.update({
    where: { id: person.id },
    data: {
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date(),
      preferences: {
        ...existingPrefs,
        ...(partialData?.interests && { primaryInterests: partialData.interests }),
        onboardingSkipped: true,
        onboardingVersion: 1,
      },
    },
  });

  revalidatePath("/");
}

export async function resetOnboarding() {
  const person = await getOrCreatePerson();

  await prisma.person.update({
    where: { id: person.id },
    data: {
      hasCompletedOnboarding: false,
      onboardingCompletedAt: null,
    },
  });

  revalidatePath("/");
}

export async function getOnboardingStatus() {
  const person = await getOrCreatePerson();
  return {
    hasCompletedOnboarding: person.hasCompletedOnboarding,
    onboardingCompletedAt: person.onboardingCompletedAt,
  };
}
