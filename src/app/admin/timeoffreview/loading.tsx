import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function Loading() {
  return (
    <div className="w-full">
      <div className="relative w-full md:w-[calc(100vw-15rem)] md:ml-6 lg:w-[calc(100vw-20rem)] lg:ml-6 h-full overflow-hidden flex-1 transition-all duration-300">
        {/* Header */}
        <Skeleton className="h-8 w-64 mb-6" />

        <div className="space-y-6">
          {/* Time Off Request Cards */}
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="w-full max-w-screen-lg">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-48" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-64" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details" disabled>
                      <Skeleton className="h-4 w-16" />
                    </TabsTrigger>
                    <TabsTrigger value="time" disabled>
                      <Skeleton className="h-4 w-32" />
                    </TabsTrigger>
                    <TabsTrigger value="actions" disabled>
                      <Skeleton className="h-4 w-16" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-18" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="time">
                    <div className="space-y-4">
                      {/* Sick Time Section */}
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                      </div>

                      {/* Vacation Time Section */}
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-36" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="actions">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, buttonIndex) => (
                        <Button key={buttonIndex} variant="outline" disabled className="w-full">
                          <Skeleton className="h-4 w-20" />
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
