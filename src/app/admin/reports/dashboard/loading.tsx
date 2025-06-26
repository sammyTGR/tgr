import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Loading() {
  return (
    <div className="space-y-4 w-[calc(100vw-20rem)] transition-all duration-300">
      <Tabs defaultValue="reporting">
        <div className="flex items-center space-x-2">
          <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10">
            <TabsTrigger
              value="reporting"
              className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
            >
              Daily Sales Review
            </TabsTrigger>
            <TabsTrigger
              value="sales-glance"
              className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
            >
              Sales At A Glance
            </TabsTrigger>
            <TabsTrigger
              value="sales-employee"
              className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
            >
              Sales By Employee
            </TabsTrigger>
            <TabsTrigger
              value="sales-kpis"
              className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
            >
              KPIs
            </TabsTrigger>
            <TabsTrigger
              value="metrics"
              className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
            >
              Key Metrics
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="relative section w-full overflow-hidden">
          <TabsContent value="reporting">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-w-[calc(100vw-10rem)] overflow-hidden">
              {/* Todos Card */}
              <div className="w-full overflow-hidden">
                <Skeleton className="h-6 w-16 mb-2" />
                <div className="col-span-full overflow-hidden mt-2">
                  <div className="h-[calc(100vh-12rem)] w-full overflow-hidden">
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 flex-1" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Patch Notes Card */}
              <div className="w-full max-h-[calc(100vh-50px)] overflow-hidden">
                <Skeleton className="h-6 w-24 mb-2" />
                <div className="col-span-full overflow-hidden mt-2">
                  <ScrollArea className="h-[calc(100vh-25rem)] w-full overflow-hidden relative">
                    <div className="h-full w-full overflow-hidden">
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </div>
              </div>

              {/* Reports Overview */}
              <div className="w-full col-span-1 md:col-span-2">
                <Skeleton className="h-6 w-32 mb-2" />
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-1 mt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-6 rounded" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-3 w-24 mb-2" />
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-3 w-28 mb-2" />
                        <div className="flex items-center mt-2">
                          <Skeleton className="h-4 w-4 rounded-full mr-2" />
                          <Skeleton className="h-5 w-20 rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Employee Suggestions Section */}
            <div className="w-full col-span-1 md:col-span-2 mt-4">
              <Card className="flex flex-col col-span-full h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-40" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Skeleton className="h-4 w-24" />
                          </TableHead>
                          <TableHead>
                            <Skeleton className="h-4 w-20" />
                          </TableHead>
                          <TableHead>
                            <Skeleton className="h-4 w-12" />
                          </TableHead>
                          <TableHead>
                            <Skeleton className="h-4 w-16" />
                          </TableHead>
                          <TableHead>
                            <Skeleton className="h-4 w-16" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Skeleton className="h-4 w-20" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-32" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-16 rounded" />
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Skeleton className="h-8 w-16 rounded" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales">
            <div className="w-full overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 my-2 gap-6 overflow-hidden">
                {/* Date Selection Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      <Skeleton className="h-6 w-48" />
                    </CardTitle>
                    <Skeleton className="h-8 w-8 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full rounded" />
                  </CardContent>
                </Card>

                {/* Upload Card */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      <Skeleton className="h-6 w-40" />
                    </CardTitle>
                    <Skeleton className="h-8 w-8 rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full rounded" />
                      <Skeleton className="h-10 w-full rounded" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sales Chart */}
            <div className="relative col-span-full w-[calc(100vw-40rem)] h-full overflow-hidden flex-1 transition-all duration-300">
              <Card className="relative w-[calc(100vw-40rem)] h-full overflow-hidden flex-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[400px] w-full rounded" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales-glance">
            <div className="w-full overflow-hidden">
              <Card className="flex flex-col col-span-full h-full mb-4">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-48 rounded" />
                    <Skeleton className="h-10 w-32 rounded" />
                  </div>

                  <div className="space-y-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <CardTitle>
                            <Skeleton className="h-6 w-32" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-[200px] w-full rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales-employee">
            <div className="w-full overflow-hidden">
              <Card className="flex flex-col col-span-full h-full">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="h-[calc(100vh-300px)] overflow-auto relative">
                  <CardContent className="flex-grow overflow-auto">
                    <Skeleton className="h-[400px] w-full rounded" />
                  </CardContent>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales-kpis">
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle>
                        <Skeleton className="h-6 w-24" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-20 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Skeleton className="h-6 w-32" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full rounded" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Skeleton className="h-6 w-28" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full rounded" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="grid gap-6">
              {/* 2024 Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-24" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Skeleton className="h-4 w-16" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-4 w-16" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="grid grid-cols-1 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="bg-muted/50">
                          <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-32 mb-2" />
                            <Skeleton className="h-2 w-full rounded" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2025 Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-24" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Skeleton className="h-4 w-16" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-4 w-16" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="grid grid-cols-1 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="bg-muted/50">
                          <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-32 mb-2" />
                            <Skeleton className="h-2 w-full rounded" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Skeleton className="h-[400px] w-full rounded mt-6" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
