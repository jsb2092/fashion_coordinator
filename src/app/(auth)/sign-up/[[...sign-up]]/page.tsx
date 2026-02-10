import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
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

      {/* Clerk SignUp - styled via ClerkStyleFix component */}
      <SignUp forceRedirectUrl="/wardrobe" />
    </div>
  );
}
