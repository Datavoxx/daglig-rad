import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PlanningSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Project selector */}
      <Skeleton className="h-10 w-64" />

      {/* Timeline skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Week headers */}
          <div className="flex gap-4 pl-32">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-8" />
            ))}
          </div>

          {/* Phase rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <div className="flex-1 relative h-8">
                <Skeleton 
                  className="absolute h-full rounded-lg" 
                  style={{ 
                    left: `${i * 15}%`, 
                    width: `${30 + Math.random() * 20}%` 
                  }} 
                />
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="pt-4 border-t flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
