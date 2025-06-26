import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Loading() {
  return (
    <div className="relative max-w-6xl ml-6 md:ml-6 lg:ml-6 md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-30rem)] h-full overflow-hidden flex-1 transition-all duration-300">
      <Card className="flex flex-col h-full max-w-6xl md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-30rem)] mx-auto my-12">
        <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-4">
            <Avatar>
              <Skeleton className="w-12 h-12 rounded-full" />
              <AvatarFallback>
                <Skeleton className="w-12 h-12 rounded-full" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </header>

        <Tabs defaultValue="clock" className="w-full">
          <TabsList className="border-b border-gray-200 dark:border-gray-700">
            <TabsTrigger value="clock" disabled>
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
            <TabsTrigger value="schedules" disabled>
              <Skeleton className="h-4 w-20" />
            </TabsTrigger>
            <TabsTrigger value="performance" disabled>
              <Skeleton className="h-4 w-24" />
            </TabsTrigger>
            <TabsTrigger value="forms" disabled>
              <Skeleton className="h-4 w-12" />
            </TabsTrigger>
            <TabsTrigger value="reviews" disabled>
              <Skeleton className="h-4 w-16" />
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-5rem)] max-w-6xl md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-30rem)] overflow-hidden relative">
            <main className="relative max-w-6xl mx-auto md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-30rem)] h-full overflow-hidden flex-1 transition-all duration-300">
              <div className="p-6">
                <Skeleton className="h-8 w-32 mb-6" />

                <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-3">
                  {/* Time Card Skeleton */}
                  <Card className="mt-4">
                    <CardHeader className="flex justify-between items-center">
                      <CardTitle>
                        <Skeleton className="h-6 w-24" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="mx-auto">
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>

                  {/* Current Shift Skeleton */}
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>
                        <Skeleton className="h-6 w-28" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Today's Hours Skeleton */}
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>
                        <Skeleton className="h-6 w-24" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mx-auto" />
                    </CardContent>
                  </Card>
                </div>

                {/* Additional content skeleton */}
                <div className="mt-6 space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            </main>
          </ScrollArea>
        </Tabs>
      </Card>
    </div>
  );
}
