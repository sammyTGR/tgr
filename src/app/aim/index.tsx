"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchInventory } from "@/app/api/aim/servicestack-api";
import {
  SearchInventoryResponse,
  SearchInventoryApiResult,
} from "@/app/api/aim/dtos";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function AimPage() {
  const [searchParams, setSearchParams] = React.useState({
    searchStr: "",
    includeSerials: true,
    includeMedia: true,
    includeAccessories: true,
    includePackages: true,
    includeDetails: true,
    includeIconImage: true,
    exactModel: false,
    startOffset: 0,
    recordCount: 50,
    locFk: undefined as number | undefined,
    minimumAvailableQuantity: undefined as number | undefined,
  });

  const searchQuery = useQuery<SearchInventoryResponse, Error>({
    queryKey: ["inventorySearch", searchParams],
    queryFn: async () => {
      return searchInventory(searchParams.searchStr, {
        includeSerials: searchParams.includeSerials,
        includeMedia: searchParams.includeMedia,
        includeAccessories: searchParams.includeAccessories,
        includePackages: searchParams.includePackages,
        includeDetails: searchParams.includeDetails,
        includeIconImage: searchParams.includeIconImage,
        exactModel: searchParams.exactModel,
        startOffset: searchParams.startOffset,
        recordCount: searchParams.recordCount,
        locFk: searchParams.locFk,
        minimumAvailableQuantity: searchParams.minimumAvailableQuantity,
      });
    },
    enabled: false,
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
              <Label htmlFor="searchStr">Search Term</Label>
              <Input
                id="searchStr"
                value={searchParams.searchStr}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    searchStr: e.target.value,
                  }))
                }
                placeholder="Enter search terms..."
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSerials"
                  checked={searchParams.includeSerials}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      includeSerials: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="includeSerials">Include Serials</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMedia"
                  checked={searchParams.includeMedia}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      includeMedia: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="includeMedia">Include Media</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAccessories"
                  checked={searchParams.includeAccessories}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      includeAccessories: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="includeAccessories">Include Accessories</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exactModel"
                  checked={searchParams.exactModel}
                  onCheckedChange={(checked) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      exactModel: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="exactModel">Exact Model Match</Label>
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

      {searchQuery.isError && (
        <div className="text-red-500 mb-4">
          Error: {searchQuery.error.message}
        </div>
      )}

      {searchQuery.isLoading && (
        <div className="text-center py-4">
          <p>Loading...</p>
        </div>
      )}

      {searchQuery.data?.Records?.length === 0 && (
        <div className="text-center py-4">
          <p>No results found</p>
        </div>
      )}

      {searchQuery.data?.Records && searchQuery.data.Records.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {searchQuery.data.Records.map(
            (item: SearchInventoryApiResult, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{item.Description || "No Description"}</CardTitle>
                  <CardDescription>{item.Model}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Manufacturer:</span>{" "}
                      {item.Mfg || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Category:</span>{" "}
                      {item.CategoryDescription || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Subcategory:</span>{" "}
                      {item.SubCategoryDescription || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">SKU:</span>{" "}
                      {item.Sku || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Price:</span> $
                      {item.CustomerPrice?.toFixed(2) ?? "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
