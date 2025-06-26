'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DrosGuideLoading() {
  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Support Menu Skeleton */}
      <div className="mx-auto sticky top-0 z-40 bg-background">
        <Skeleton className="h-12 w-full max-w-4xl mx-auto" />
      </div>

      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="dros-guide" className="space-y-6">
          {/* Tabs List Skeleton */}
          <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <TabsTrigger key={i} value={`tab-${i}`} disabled>
                <Skeleton className="h-4 w-24" />
              </TabsTrigger>
            ))}
          </TabsList>

          {/* DROS Guide Tab Content Skeleton */}
          <TabsContent value="dros-guide">
            <div className="grid gap-6">
              {/* Selection Criteria Card */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements Card */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>

              {/* Reset Button */}
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </TabsContent>

          {/* Assault Weapons Tab Content Skeleton */}
          <TabsContent value="assault-weapons">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-4 pb-4 border-b">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>

                  {/* Table Rows */}
                  {Array.from({ length: 10 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-4 gap-4 py-4 border-b">
                      {Array.from({ length: 4 }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Devices Tab Content Skeleton */}
          <TabsContent value="approved-devices">
            <div className="space-y-4">
              {/* Search Controls Skeleton */}
              <div className="flex gap-2 mb-2 ml-1">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-64" />
              </div>

              {/* Table Skeleton */}
              <Card className="w-[calc(100vw-45rem)]">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 gap-4 pb-4 border-b">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>

                    {/* Table Rows */}
                    {Array.from({ length: 10 }).map((_, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-4 gap-4 py-4 border-b">
                        {Array.from({ length: 4 }).map((_, colIndex) => (
                          <Skeleton key={colIndex} className="h-4 w-full" />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Skeleton */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FSD Info Tab Content Skeleton */}
          <TabsContent value="fsd-info">
            <div className="space-y-6">
              {/* Add Button Skeleton */}
              <Skeleton className="h-10 w-32 mb-2" />

              {/* Table Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-4 pb-4 border-b">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>

                    {/* Table Rows */}
                    {Array.from({ length: 8 }).map((_, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-6 gap-4 py-4 border-b">
                        {Array.from({ length: 6 }).map((_, colIndex) => (
                          <Skeleton key={colIndex} className="h-4 w-full" />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardContent>
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
