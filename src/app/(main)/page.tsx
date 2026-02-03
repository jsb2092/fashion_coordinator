import { Suspense } from "react";
import Link from "next/link";
import { getWardrobeItems } from "@/lib/actions";
import { WardrobeGrid } from "@/components/wardrobe/WardrobeGrid";
import { ItemFilters } from "@/components/wardrobe/ItemFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    formality?: string;
    season?: string;
    search?: string;
  }>;
}

async function WardrobeContent({
  searchParams,
}: {
  searchParams: PageProps["searchParams"];
}) {
  const params = await searchParams;
  const items = await getWardrobeItems({
    category: params.category,
    status: params.status || "ACTIVE",
    formalityLevel: params.formality ? parseInt(params.formality) : undefined,
    season: params.season,
    search: params.search,
  });

  return <WardrobeGrid items={items} />;
}

function WardrobeSkeleton() {
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

export default async function WardrobePage({ searchParams }: PageProps) {
  return (
    <div className="flex h-full">
      <aside className="w-64 border-r p-4 hidden lg:block">
        <Suspense fallback={<div className="space-y-4"><Skeleton className="h-6 w-20" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}>
          <ItemFilters />
        </Suspense>
      </aside>
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Wardrobe</h1>
            <p className="text-muted-foreground">
              Manage your clothing collection
            </p>
          </div>
          <Link href="/wardrobe/upload">
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
              Add Item
            </Button>
          </Link>
        </div>
        <Suspense fallback={<WardrobeSkeleton />}>
          <WardrobeContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
