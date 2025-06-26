import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
