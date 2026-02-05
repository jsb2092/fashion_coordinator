import { Suspense } from "react";
import Link from "next/link";
import { getCareSupplies, getShoes } from "@/lib/actions";
import { CareSupplyGrid } from "@/components/shoe-care/CareSupplyGrid";
import { SupplyFilters } from "@/components/shoe-care/SupplyFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    search?: string;
  }>;
}

async function ShoeCareContent({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  const params = await searchParams;
  const [supplies, shoes] = await Promise.all([
    getCareSupplies({
      category: params.category,
      status: params.status,
      search: params.search,
    }),
    getShoes(),
  ]);

  return <CareSupplyGrid supplies={supplies} shoes={shoes} />;
}

function ShoeCareContentSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default async function ShoeCareePage({ searchParams }: PageProps) {
  return (
    <div className="flex h-full">
      <aside className="w-64 border-r p-4 hidden lg:block">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <SupplyFilters />
        </Suspense>
      </aside>
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Shoe Care Supplies</h1>
            <p className="text-muted-foreground">
              Manage your polishes, brushes, and accessories
            </p>
          </div>
          <Link href="/shoe-care/add">
            <Button>
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add Supply
            </Button>
          </Link>
        </div>
        <Suspense fallback={<ShoeCareContentSkeleton />}>
          <ShoeCareContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
