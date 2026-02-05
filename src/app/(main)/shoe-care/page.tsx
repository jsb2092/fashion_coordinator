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
          <div className="flex gap-2">
            <Link href="/shoe-care/polish">
              <Button variant="outline">
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
                    d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                  />
                </svg>
                Polish a Shoe
              </Button>
            </Link>
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
        </div>
        <Suspense fallback={<ShoeCareContentSkeleton />}>
          <ShoeCareContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
