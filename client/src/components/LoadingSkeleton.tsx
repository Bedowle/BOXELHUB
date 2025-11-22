import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function ProjectCardSkeleton() {
  return (
    <Card data-testid="skeleton-project-card">
      <CardHeader className="space-y-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  );
}

export function BidCardSkeleton() {
  return (
    <Card className="border" data-testid="skeleton-bid-card">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </Card>
  );
}
