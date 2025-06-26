'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function CrewCalendarLoading() {
  return (
    <div className="relative max-w-6xl ml-6 md:ml-6 lg:ml-6 md:w-[calc(100vw-30rem)] lg:w-[calc(100vw-20rem) overflow-hidden flex-1 transition-all duration-300">
      {/* Header Section */}
      <div className="flex flex-col w-full items-center mb-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Controls Section */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Main Calendar Card */}
      <Card className="relative max-w-6xl md:w-[calc(100vw-30rem)] lg:w-[calc(100vw-20rem)] h-full overflow-hidden flex-1 transition-all duration-300">
        <CardContent className="h-full flex flex-col">
          {/* Navigation Buttons */}
          <div className="flex justify-between w-full mb-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Calendar Table */}
          <div className="overflow-hidden">
            <div className="h-[calc(100vh-15rem)] overflow-hidden relative">
              <Table className="w-full overflow-hidden">
                <TableHeader className="sticky top-0 z-5 bg-background">
                  <TableRow>
                    <TableHead className="text-left w-30 max-w-sm bg-background sticky left-0 z-5">
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <TableHead key={i} className="text-left w-30 max-w-sm">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className="text-left font-medium w-23 sticky max-w-sm z-5 bg-background">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      {Array.from({ length: 7 }).map((_, colIndex) => (
                        <TableCell
                          key={colIndex}
                          className="text-left relative group w-23 max-w-sm"
                        >
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
