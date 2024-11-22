"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { searchInventory } from "@/app/api/aim/servicestack-api";
import {
  SearchInventoryApiResult,
  SearchInventoryRequest,
} from "@/app/api/aim/dtos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AimPage() {
  const [searchParams, setSearchParams] = React.useState<
    Partial<SearchInventoryRequest>
  >({
    SearchStr: "",
    IncludeSerials: true,
    IncludeMedia: true,
    IncludeAccessories: true,
    IncludePackages: true,
    IncludeDetails: true,
    IncludeIconImage: true,
    ExactModel: false,
    StartOffset: 0,
    RecordCount: 50,
    LocFk: undefined,
    MinimumAvailableQuantity: undefined,
  });

  const searchQuery = useQuery({
    queryKey: ["inventorySearch", searchParams],
    queryFn: () => searchInventory(searchParams as SearchInventoryRequest),
    enabled: Boolean(searchParams.SearchStr), // Only run when there's a search string
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchQuery.refetch();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AIM Inventory Search</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>Configure your inventory search</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="SearchStr">Search Term</Label>
              <Input
                id="SearchStr"
                value={searchParams.SearchStr}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    SearchStr: e.target.value,
                  }))
                }
                placeholder="Enter search terms..."
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="IncludeSerials"
                  checked={searchParams.IncludeSerials}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      IncludeSerials: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="IncludeSerials">Include Serials</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="IncludeMedia"
                  checked={searchParams.IncludeMedia}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      IncludeMedia: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="IncludeMedia">Include Media</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="IncludeAccessories"
                  checked={searchParams.IncludeAccessories}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      IncludeAccessories: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="IncludeAccessories">Include Accessories</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ExactModel"
                  checked={searchParams.ExactModel}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      ExactModel: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="ExactModel">Exact Model Match</Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={searchQuery.isFetching}
              className="w-full md:w-auto"
            >
              {searchQuery.isFetching ? "Searching..." : "Search Inventory"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchQuery.isLoading && (
        <div className="text-center py-4">
          <p>Loading results...</p>
        </div>
      )}

      {searchQuery.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          Error: {(searchQuery.error as Error).message}
        </div>
      )}

      {searchQuery.data?.Records && searchQuery.data.Records.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchQuery.data.TotalRecords} items (Showing{" "}
              {searchQuery.data.StartOffset + 1} -{" "}
              {searchQuery.data.StartOffset + searchQuery.data.Records.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchQuery.data.Records.map(
                    (item: SearchInventoryApiResult, index: number) => (
                      <TableRow key={`${item.ItemFk}-${index}`}>
                        <TableCell className="font-medium">
                          {item.Model}
                        </TableCell>
                        <TableCell>{item.Description}</TableCell>
                        <TableCell>{item.CategoryDescription}</TableCell>
                        <TableCell>{item.Mfg}</TableCell>
                        <TableCell className="text-right">
                          {item.CustomerPrice
                            ? new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(item.CustomerPrice)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {searchQuery.data?.Records?.length === 0 && (
        <div className="text-center py-4">
          <p>No results found.</p>
        </div>
      )}
    </div>
  );
}
