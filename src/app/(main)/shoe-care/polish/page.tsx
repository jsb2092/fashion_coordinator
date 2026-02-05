import { Suspense } from "react";
import { getShoes, getCareSupplies } from "@/lib/actions";
import { PolishInstructions } from "@/components/shoe-care/PolishInstructions";
import { Skeleton } from "@/components/ui/skeleton";

async function PolishContent() {
  const [shoes, supplies] = await Promise.all([
    getShoes(),
    getCareSupplies(),
  ]);

  return <PolishInstructions shoes={shoes} suppliesCount={supplies.length} />;
}

export default function PolishPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Polish a Shoe</h1>
        <p className="text-muted-foreground">
          Select a shoe to get personalized care instructions based on your supplies
        </p>
      </div>
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      }>
        <PolishContent />
      </Suspense>
    </div>
  );
}
