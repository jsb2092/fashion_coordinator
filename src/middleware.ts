import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    try {
      await auth.protect();
    } catch (error: unknown) {
      // If there's a JWT key mismatch (e.g., switched Clerk instances),
      // clear the invalid session cookies and redirect to sign-in
      const errorReason = (error as { reason?: string })?.reason;
      if (errorReason === "jwk-kid-mismatch" || errorReason === "jwk-failed-to-resolve") {
        const response = NextResponse.redirect(new URL("/sign-in", req.url));
        // Clear Clerk session cookies
        response.cookies.delete("__session");
        response.cookies.delete("__client_uat");
        response.cookies.delete("__clerk_db_jwt");
        return response;
      }
      throw error;
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt)).*)",
    "/(api|trpc)(.*)",
  ],
};
