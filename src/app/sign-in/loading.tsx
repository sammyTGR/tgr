import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center">
            <Skeleton className="h-8 w-32 mx-auto" />
          </CardTitle>
          <Skeleton className="h-4 w-48 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded" />
          </div>

          {/* Password input skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded" />
          </div>

          {/* Sign in button skeleton */}
          <Skeleton className="h-10 w-full rounded" />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Skeleton className="w-full h-px" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <Skeleton className="h-4 w-16 bg-background px-2" />
            </div>
          </div>

          {/* OAuth buttons skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </div>

          {/* Footer links skeleton */}
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
