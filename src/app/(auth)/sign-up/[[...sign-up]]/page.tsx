import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] px-4">
      {/* Logo and branding */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <Image
          src="/outfit-iq-icon.svg"
          alt="Outfit IQ"
          width={80}
          height={80}
          className="rounded-2xl shadow-lg"
        />
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#f0ece4]">
            Outfit IQ
          </h1>
          <p className="text-sm text-[#8a8a9a] mt-1">Smart Wardrobe Planning</p>
        </div>
      </div>

      {/* Clerk SignUp */}
      <SignUp forceRedirectUrl="/wardrobe" />
    </div>
  );
}
