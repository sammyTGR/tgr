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
import {
  SearchInventoryRequest,
  SearchInventoryResponse,
  SearchInventoryApiResult,
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
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AimPage() {
  const [searchParams, setSearchParams] =
    React.useState<SearchInventoryRequest>(
      new SearchInventoryRequest({
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
      })
    );

  const debouncedSearchStr = useDebounce(searchParams.SearchStr, 500);

  const searchQuery = useQuery({
    queryKey: ["inventorySearch", debouncedSearchStr, searchParams],
    queryFn: async () => {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data: SearchInventoryResponse = await response.json();

      if (data.Status?.StatusCode === "Error") {
        throw new Error(data.Status.ErrorMessage || "API Error");
      }

      return data;
    },
    enabled: Boolean(debouncedSearchStr),
  });

  const handleSearchChange = (value: string) => {
    setSearchParams(
      (prev) =>
        new SearchInventoryRequest({
          ...prev,
          SearchStr: value,
        })
    );
  };

  const handleCheckboxChange = (
    field: keyof SearchInventoryRequest,
    checked: boolean
  ) => {
    setSearchParams(
      (prev) =>
        new SearchInventoryRequest({
          ...prev,
          [field]: checked,
        })
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AIM Inventory Search</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>
            Search inventory by manufacturer name or other details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="SearchStr">Manufacturer Name Search</Label>
              <Input
                id="SearchStr"
                value={searchParams.SearchStr}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Enter manufacturer name..."
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                This will search across all fields including manufacturer names
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="IncludeSerials"
                  checked={searchParams.IncludeSerials}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("IncludeSerials", checked as boolean)
                  }
                />
                <Label htmlFor="IncludeSerials">Include Serials</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="IncludeMedia"
                  checked={searchParams.IncludeMedia}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("IncludeMedia", checked as boolean)
                  }
                />
                <Label htmlFor="IncludeMedia">Include Media</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="IncludeAccessories"
                  checked={searchParams.IncludeAccessories}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(
                      "IncludeAccessories",
                      checked as boolean
                    )
                  }
                />
                <Label htmlFor="IncludeAccessories">Include Accessories</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ExactModel"
                  checked={searchParams.ExactModel}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange("ExactModel", checked as boolean)
                  }
                />
                <Label htmlFor="ExactModel">Exact Model Match</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {searchQuery.isError && (
        <div className="text-red-500 mb-4">
          Error: {(searchQuery.error as Error).message}
        </div>
      )}

      {searchQuery.isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {searchQuery.data?.Records && searchQuery.data.Records.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchQuery.data.TotalRecords ?? 0} items
              {searchQuery.data.StartOffset !== undefined &&
                searchQuery.data.Records && (
                  <>
                    {" "}
                    (Showing {searchQuery.data.StartOffset + 1} -{" "}
                    {searchQuery.data.StartOffset +
                      searchQuery.data.Records.length}
                    )
                  </>
                )}
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
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchQuery.data.Records.map(
                    (item: SearchInventoryApiResult) => (
                      <TableRow key={item.Pk}>
                        <TableCell className="font-medium">
                          {item.Model || "N/A"}
                        </TableCell>
                        <TableCell>{item.Description || "N/A"}</TableCell>
                        <TableCell>
                          {item.CategoryDescription || "N/A"}
                        </TableCell>
                        <TableCell>{item.Manufacturer || "N/A"}</TableCell>
                        <TableCell>{item.Sku || "N/A"}</TableCell>
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
      ) : searchQuery.isSuccess ? (
        <Card className="mt-6">
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground">No results found.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
