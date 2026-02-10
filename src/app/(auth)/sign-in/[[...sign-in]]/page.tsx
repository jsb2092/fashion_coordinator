import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
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
          <h1 className="text-2xl font-semibold text-slate-800">
            Outfit IQ
          </h1>
          <p className="text-sm text-slate-500 mt-1">Smart Wardrobe Planning</p>
        </div>
      </div>

      {/* Clerk SignIn */}
      <SignIn
        forceRedirectUrl="/wardrobe"
        signUpForceRedirectUrl="/wardrobe"
      />
    </div>
  );
}
