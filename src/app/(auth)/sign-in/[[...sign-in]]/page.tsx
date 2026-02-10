import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Image from "next/image";

const navyTheme = {
  bg: "#0f0f1a",
  bgCard: "#1a1a2e",
  bgInput: "#252540",
  text: "#f0ece4",
  textMuted: "#8a8a9a",
  border: "#2a2a45",
  gold: "#dfc08a",
  goldDark: "#0f0f1a",
};

const clerkAuthAppearance = {
  baseTheme: dark,
  variables: {
    colorBackground: navyTheme.bgCard,
    colorText: navyTheme.text,
    colorTextSecondary: navyTheme.textMuted,
    colorInputBackground: navyTheme.bgInput,
    colorInputText: navyTheme.text,
    colorPrimary: navyTheme.gold,
  },
  elements: {
    rootBox: {
      backgroundColor: "transparent",
    },
    card: {
      backgroundColor: navyTheme.bgCard,
      borderColor: navyTheme.border,
    },
    cardBox: {
      backgroundColor: navyTheme.bgCard,
    },
    main: {
      backgroundColor: navyTheme.bgCard,
    },
    formFieldInput: {
      backgroundColor: navyTheme.bgInput,
      borderColor: navyTheme.border,
      color: navyTheme.text,
    },
    formFieldInputGroup: {
      backgroundColor: navyTheme.bgInput,
      borderColor: navyTheme.border,
    },
    formButtonPrimary: {
      backgroundColor: navyTheme.gold,
      color: navyTheme.goldDark,
    },
    socialButtonsBlockButton: {
      backgroundColor: navyTheme.bgInput,
      borderColor: navyTheme.border,
      color: navyTheme.text,
    },
    socialButtonsBlockButtonText: {
      color: navyTheme.text,
    },
    dividerLine: {
      backgroundColor: navyTheme.border,
    },
    dividerText: {
      color: navyTheme.textMuted,
    },
    headerTitle: {
      color: navyTheme.text,
    },
    headerSubtitle: {
      color: navyTheme.textMuted,
    },
    formFieldLabel: {
      color: navyTheme.text,
    },
    footer: {
      backgroundColor: navyTheme.bgCard,
    },
    footerAction: {
      backgroundColor: navyTheme.bgCard,
    },
    footerActionText: {
      color: navyTheme.textMuted,
    },
    footerActionLink: {
      color: navyTheme.gold,
    },
    footerItem: {
      backgroundColor: navyTheme.bgCard,
    },
    footerPages: {
      backgroundColor: navyTheme.bgCard,
    },
    footerPagesLink: {
      color: navyTheme.textMuted,
    },
    identityPreviewText: {
      color: navyTheme.text,
    },
    identityPreviewEditButtonIcon: {
      color: navyTheme.text,
    },
    formFieldInputShowPasswordButton: {
      color: navyTheme.textMuted,
    },
    otpCodeFieldInput: {
      backgroundColor: navyTheme.bgInput,
      borderColor: navyTheme.border,
      color: navyTheme.text,
    },
    alternativeMethodsBlockButton: {
      backgroundColor: navyTheme.bgInput,
      borderColor: navyTheme.border,
      color: navyTheme.text,
    },
  },
};

export default function SignInPage() {
  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-[#0f0f1a] px-4">
      {/* Logo and branding */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <Image
          src="/outfit-iq-icon.svg"
          alt="Outfit IQ"
          width={80}
          height={80}
          className="rounded-2xl"
        />
        <div className="text-center">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-[#c9a96e] via-[#dfc08a] to-[#b8944f] bg-clip-text text-transparent">
            Outfit IQ
          </h1>
          <p className="text-sm text-[#8a8a9a] mt-1">Smart Wardrobe Planning</p>
        </div>
      </div>

      {/* Clerk SignIn */}
      <SignIn
        appearance={clerkAuthAppearance}
        forceRedirectUrl="/wardrobe"
        signUpForceRedirectUrl="/wardrobe"
      />
    </div>
  );
}
