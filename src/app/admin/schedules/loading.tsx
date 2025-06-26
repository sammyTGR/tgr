import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function Loading() {
  return (
    <Card className="relative w-full ml-6 md:w-[calc(100vw-15rem)] md:ml-6 lg:w-[calc(100vw-20rem)] lg:ml-6 h-full overflow-hidden flex-1 transition-all duration-300">
      <CardHeader className="bg-muted dark:bg-muted px-6 py-4 border-b rounded-t-lg border-gray-200 dark:border-gray-700">
        <Skeleton className="h-6 w-64" />
      </CardHeader>

      <Tabs defaultValue="scheduling" className="w-full">
        <TabsList className="border-b border-gray-200 dark:border-gray-700">
          <TabsTrigger value="scheduling" disabled>
            <Skeleton className="h-4 w-16" />
          </TabsTrigger>
          <TabsTrigger value="timesheets" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduling">
          <div className="space-y-6 p-4">
            {/* Schedule Generation Section */}
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-96 mb-4" />
              <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Generate Single Schedule Card */}
                <Card className="relative h-[140px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>

                {/* Generate All Schedules Card */}
                <Card className="relative h-[140px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Schedule Management Section */}
            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Add Schedule Card */}
                <Card className="relative h-[140px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>

                {/* Update Schedule Card */}
                <Card className="relative h-[140px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>

                {/* Clear Schedule Card */}
                <Card className="relative h-[140px]">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <Skeleton className="h-5 w-30" />
                    <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Schedule Display Section */}
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-24" />
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left">
                              <Skeleton className="h-4 w-24" />
                            </th>
                            <th className="px-4 py-2 text-left">
                              <Skeleton className="h-4 w-20" />
                            </th>
                            <th className="px-4 py-2 text-left">
                              <Skeleton className="h-4 w-16" />
                            </th>
                            <th className="px-4 py-2 text-left">
                              <Skeleton className="h-4 w-14" />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 8 }).map((_, i) => (
                            <tr key={i}>
                              <td className="px-4 py-2">
                                <Skeleton className="h-4 w-32" />
                              </td>
                              <td className="px-4 py-2">
                                <Skeleton className="h-4 w-20" />
                              </td>
                              <td className="px-4 py-2">
                                <Skeleton className="h-4 w-16" />
                              </td>
                              <td className="px-4 py-2">
                                <Skeleton className="h-4 w-16" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timesheets">
          <div className="grid p-2 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Add Timesheet Card */}
            <Card className="relative h-[140px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-5 w-36" />
                <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          </div>

          <div className="w-full overflow-hidden">
            <div className="space-y-4">
              {/* Table Header */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-24" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-12" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-16" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-20" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-18" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-14" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-16" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-8" />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <Skeleton className="h-4 w-20" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="px-4 py-2">
                          <Skeleton className="h-4 w-16" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
