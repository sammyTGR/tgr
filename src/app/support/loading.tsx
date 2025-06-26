import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl" />
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-full">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-32" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-full" />
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
