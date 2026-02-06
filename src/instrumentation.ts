export async function register() {
  // Only run on server startup, not during build
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedDemoAccount } = await import("@/lib/seed-demo-account");

    // Run seed in background - don't block server startup
    seedDemoAccount().catch((error) => {
      console.error("[Demo Seed] Failed to seed demo account:", error);
    });
  }
}
