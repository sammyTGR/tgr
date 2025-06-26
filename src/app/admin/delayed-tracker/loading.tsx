'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DelayedTrackerLoading() {
  return (
    <div className="ml-4 mt-4 relative max-w-[calc(100vw-20rem)] md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-10rem)] overflow-hidden flex-1 transition-all duration-300">
      {/* Form Card Skeleton */}
      <Card className="relative max-w-[calc(100vw-20rem)] md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-10rem)] h-full overflow-hidden flex-1 transition-all duration-300">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-start mt-6 space-x-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card Skeleton */}
      <Card className="mt-4 relative max-w-[calc(100vw-20rem)] md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-10rem)] h-full overflow-hidden flex-1 transition-all duration-300">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: 12 }).map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
