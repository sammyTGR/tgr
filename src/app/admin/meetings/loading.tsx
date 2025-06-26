import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dot } from 'lucide-react';

export default function Loading() {
  return (
    <div className="relative w-full md:w-[calc(100vw-25rem)] lg:w-[calc(100vw-25rem)] mx-auto ml-0 md:ml-4 h-full overflow-auto flex-1 transition-all duration-300">
      <main className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-2 sm:p-4 sm:px-6 sm:py-0 md:gap-8">
        {/* Header */}
        <Skeleton className="h-8 w-48 mb-4" />

        {/* Add Yourself Section */}
        <div className="flex flex-col items-start gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-80" />
        </div>

        <Tabs defaultValue="weekly-notes" className="w-full">
          {/* Tabs List */}
          <div className="flex items-center space-x-2 mb-4">
            <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10">
              <TabsTrigger value="weekly-notes" disabled>
                <Skeleton className="h-4 w-24" />
              </TabsTrigger>
              <TabsTrigger value="edit-notes" disabled>
                <Skeleton className="h-4 w-28" />
              </TabsTrigger>
              <TabsTrigger value="discussed-notes" disabled>
                <Skeleton className="h-4 w-32" />
              </TabsTrigger>
            </TabsList>
          </div>

          <Card className="mt-4">
            <CardContent className="pt-6">
              {/* Team Updates Tab */}
              <TabsContent value="weekly-notes">
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>
                          <Skeleton className="h-6 w-32" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="ml-6">
                        {/* Range Notes */}
                        <div className="mb-2">
                          <Skeleton className="h-4 w-16 mb-2" />
                          <ul className="list-none ml-2">
                            {Array.from({ length: 2 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-48" />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Inventory Notes */}
                        <div className="mb-2">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <ul className="list-none ml-2">
                            {Array.from({ length: 1 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-40" />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Store Notes */}
                        <div className="mb-2">
                          <Skeleton className="h-4 w-14 mb-2" />
                          <ul className="list-none ml-2">
                            {Array.from({ length: 1 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-36" />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Employees Notes */}
                        <div className="mb-2">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <ul className="list-none ml-2">
                            <li className="flex items-start text-sm group relative">
                              <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                            </li>
                          </ul>
                        </div>

                        {/* Safety Notes */}
                        <div className="mb-2">
                          <Skeleton className="h-4 w-14 mb-2" />
                          <ul className="list-none ml-2">
                            {Array.from({ length: 1 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-44" />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* General Notes */}
                        <div className="mb-2">
                          <Skeleton className="h-4 w-16 mb-2" />
                          <ul className="list-none ml-2">
                            {Array.from({ length: 1 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-52" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Edit Notes Tab */}
              <TabsContent value="edit-notes">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="relative">
                      <CardHeader>
                        <CardTitle>
                          <Skeleton className="h-6 w-32" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Range Notes */}
                        <div className="mb-4">
                          <Skeleton className="h-4 w-16 mb-2" />
                          <div className="mt-1">
                            <div className="mt-1 flex items-center gap-2">
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                            <Skeleton className="h-8 w-24 mt-2" />
                          </div>
                        </div>

                        {/* Inventory Notes */}
                        <div className="mb-4">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <div className="mt-1">
                            <div className="text-sm text-muted-foreground">
                              <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24 mt-2" />
                          </div>
                        </div>

                        {/* Store Notes */}
                        <div className="mb-4">
                          <Skeleton className="h-4 w-14 mb-2" />
                          <div className="mt-1">
                            <div className="mt-1 flex items-center gap-2">
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                            <Skeleton className="h-8 w-24 mt-2" />
                          </div>
                        </div>

                        {/* Employees Notes */}
                        <div className="mb-4">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <div className="mt-1">
                            <div className="text-sm text-muted-foreground">
                              <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24 mt-2" />
                          </div>
                        </div>

                        {/* Safety Notes */}
                        <div className="mb-4">
                          <Skeleton className="h-4 w-14 mb-2" />
                          <div className="mt-1">
                            <div className="mt-1 flex items-center gap-2">
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                            <Skeleton className="h-8 w-24 mt-2" />
                          </div>
                        </div>

                        {/* General Notes */}
                        <div className="mb-4">
                          <Skeleton className="h-4 w-16 mb-2" />
                          <div className="mt-1">
                            <div className="text-sm text-muted-foreground">
                              <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-8 w-24 mt-2" />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-28" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Discussed Notes Tab */}
              <TabsContent value="discussed-notes">
                <div className="grid gap-6">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle>
                          <Skeleton className="h-6 w-48" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Range Notes */}
                        <div className="mb-6">
                          <Skeleton className="h-5 w-16 mb-2" />
                          <ul className="space-y-2">
                            {Array.from({ length: 2 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <div className="flex items-start">
                                  <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                  <Skeleton className="h-4 w-56" />
                                </div>
                                <Skeleton className="h-4 w-20 ml-2" />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Inventory Notes */}
                        <div className="mb-6">
                          <Skeleton className="h-5 w-20 mb-2" />
                          <ul className="space-y-2">
                            {Array.from({ length: 1 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <div className="flex items-start">
                                  <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                  <Skeleton className="h-4 w-48" />
                                </div>
                                <Skeleton className="h-4 w-24 ml-2" />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Store Notes */}
                        <div className="mb-6">
                          <Skeleton className="h-5 w-14 mb-2" />
                          <ul className="space-y-2">
                            <li className="flex items-start text-sm group relative">
                              <div className="flex items-start">
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-40" />
                              </div>
                              <Skeleton className="h-4 w-18 ml-2" />
                            </li>
                          </ul>
                        </div>

                        {/* Employees Notes */}
                        <div className="mb-6">
                          <Skeleton className="h-5 w-20 mb-2" />
                          <ul className="space-y-2">
                            <li className="flex items-start text-sm group relative">
                              <div className="flex items-start">
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-44" />
                              </div>
                              <Skeleton className="h-4 w-22 ml-2" />
                            </li>
                          </ul>
                        </div>

                        {/* Safety Notes */}
                        <div className="mb-6">
                          <Skeleton className="h-5 w-14 mb-2" />
                          <ul className="space-y-2">
                            {Array.from({ length: 1 }).map((_, itemIndex) => (
                              <li
                                key={itemIndex}
                                className="flex items-start text-sm group relative"
                              >
                                <div className="flex items-start">
                                  <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                  <Skeleton className="h-4 w-52" />
                                </div>
                                <Skeleton className="h-4 w-20 ml-2" />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* General Notes */}
                        <div className="mb-6">
                          <Skeleton className="h-5 w-16 mb-2" />
                          <ul className="space-y-2">
                            <li className="flex items-start text-sm group relative">
                              <div className="flex items-start">
                                <Dot className="h-4 w-4 mt-1 mr-1 flex-shrink-0" />
                                <Skeleton className="h-4 w-60" />
                              </div>
                              <Skeleton className="h-4 w-26 ml-2" />
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  );
}
