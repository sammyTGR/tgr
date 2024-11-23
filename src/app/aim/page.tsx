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
import { SearchInventoryRequest } from "@/app/api/aim/dtos";

export default function AimPage() {
  const [searchTrigger, setSearchTrigger] = React.useState(0);
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
    queryKey: ["inventorySearch", searchParams, searchTrigger],
    queryFn: () => searchInventory(searchParams as SearchInventoryRequest),
    enabled: Boolean(searchParams.SearchStr && searchTrigger > 0), // Only run when triggered
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTrigger(prev => prev + 1); // Increment trigger to force new search
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

      {searchQuery.isError && (
        <div className="text-red-500 mb-4">
          Error: {(searchQuery.error as Error).message}
        </div>
      )}

      {searchQuery.data && <div>{/* Render your search results here */}</div>}
    </div>
  );
}
