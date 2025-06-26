'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AuditsLoading() {
  return (
    <div className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {/* Support Menu Skeleton */}
      <div className="mb-10 my-8">
        <Skeleton className="h-12 w-full max-w-4xl mx-auto" />
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        {/* Tabs List Skeleton */}
        <div className="flex items-center space-x-2">
          <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <TabsTrigger key={i} value={`tab-${i}`} disabled>
                <Skeleton className="h-4 w-20" />
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Submit Tab Content Skeleton */}
        <TabsContent value="submit">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Form Fields Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>

                {/* Textarea Skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full" />
                </div>

                {/* Submit Button Skeleton */}
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab Content Skeleton */}
        <TabsContent value="review">
          <Card>
            <CardContent className="pt-6">
              {/* Table Skeleton */}
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-9 gap-4 pb-4 border-b">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>

                {/* Table Rows */}
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-9 gap-4 py-4 border-b">
                    {Array.from({ length: 9 }).map((_, colIndex) => (
                      <Skeleton key={colIndex} className="h-4 w-full" />
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contest Tab Content Skeleton */}
        <TabsContent value="contest">
          <div className="space-y-6">
            {/* Title Skeleton */}
            <Skeleton className="h-8 w-48 ml-2" />

            {/* Controls Grid Skeleton */}
            <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="mt-4">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    {i === 0 && (
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    )}
                    {i === 4 && (
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary Table Skeleton */}
            <Card>
              <CardContent>
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-7 gap-4 pb-4 border-b">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>

                  {/* Table Rows */}
                  {Array.from({ length: 6 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-7 gap-4 py-4 border-b">
                      {Array.from({ length: 7 }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-4 w-full" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chart Skeleton */}
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guidelines Tab Content Skeleton */}
        <TabsContent value="guidelines">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="h-[200px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <Skeleton className="h-6 w-32" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
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
  );
}
