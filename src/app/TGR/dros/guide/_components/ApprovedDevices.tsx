'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { XIcon } from 'lucide-react';

export default function ApprovedDevices() {
  const [modelFilter, setModelFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const debouncedModelFilter = useDebounce(modelFilter, 300);
  const queryClient = useQueryClient();

  // Reset to page 1 when page size changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Add new query for manufacturers
  const { data: manufacturersList = [] } = useQuery({
    queryKey: ['approved-devices-manufacturers'],
    queryFn: async () => {
      const res = await fetch('/api/approved-devices/manufacturers');
      if (!res.ok) throw new Error('Failed to fetch manufacturers');
      return res.json();
    },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['approved-devices', page, pageSize, manufacturerFilter, debouncedModelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
        model: debouncedModelFilter,
        manufacturer: manufacturerFilter,
      });
      const res = await fetch(`/api/approved-devices?${params}`);
      if (!res.ok) throw new Error('Failed to fetch approved devices');
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  // Prefetch next page
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);
  useEffect(() => {
    if (page < totalPages) {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(page * pageSize),
        model: debouncedModelFilter,
        manufacturer: manufacturerFilter,
      });
      queryClient.prefetchQuery({
        queryKey: [
          'approved-devices',
          page + 1,
          pageSize,
          manufacturerFilter,
          debouncedModelFilter,
        ],
        queryFn: async () => {
          const res = await fetch(`/api/approved-devices?${params}`);
          if (!res.ok) throw new Error('Failed to fetch approved devices');
          return res.json();
        },
      });
    }
  }, [page, pageSize, manufacturerFilter, debouncedModelFilter, totalPages, queryClient]);

  // Use the rows directly from the server response, no need for client-side filtering
  const rows = data?.rows || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2 ml-1">
        <Input
          placeholder="Search by Model"
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="w-64"
        />
        <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by Manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-manufacturers">All Manufacturers</SelectItem>
            {manufacturersList.map((manufacturer: string) => (
              <SelectItem key={manufacturer} value={manufacturer}>
                {manufacturer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Hidden clear button for accessibility */}
        {(modelFilter || (manufacturerFilter && manufacturerFilter !== 'all-manufacturers')) && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Clear search and reset manufacturer filter"
            onClick={() => {
              setModelFilter('');
              setManufacturerFilter('all-manufacturers');
            }}
            className="self-center"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
      <Card className="w-[calc(100vw-45rem)]">
        <CardHeader>
          <CardTitle>Approved Safety Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <div className="overflow-y-auto" style={{ maxHeight: '25rem' }}>
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr>
                        <th className="px-2 py-1 text-left">Manufacturer</th>
                        <th className="px-2 py-1 text-left">Model</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFetching && !isLoading
                        ? // Skeleton rows for perceived performance
                          Array.from({ length: pageSize }).map((_, i) => (
                            <tr key={i} className="border-t animate-pulse">
                              <td className="px-2 py-1 bg-muted">&nbsp;</td>
                              <td className="px-2 py-1 bg-muted">&nbsp;</td>
                              <td className="px-2 py-1 bg-muted">&nbsp;</td>
                              <td className="px-2 py-1 bg-muted">&nbsp;</td>
                            </tr>
                          ))
                        : rows.map((row: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1">{row.manufacturer || 'N/A'}</td>
                              <td className="px-2 py-1">{row.model || 'N/A'}</td>
                              <td className="px-2 py-1">{row.type || 'N/A'}</td>
                              <td className="px-2 py-1 whitespace-pre-wrap">
                                {row.description || 'N/A'}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                  {rows.length === 0 && !isFetching && (
                    <div className="text-center py-4">No results found.</div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[25, 50, 75, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm">entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="px-2 py-1 border rounded"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    className="px-2 py-1 border rounded"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
