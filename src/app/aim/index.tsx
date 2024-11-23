"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getInventoryDetail,
  searchInventory,
} from "@/app/api/aim/servicestack-api";
import { SearchInventoryResponse } from "@/app/api/aim/dtos";

export default function AimPage() {
  const [searchStr, setSearchStr] = React.useState("");

  const {
    data: inventorySearch,
    error,
    isLoading,
    refetch,
  } = useQuery<SearchInventoryResponse, Error>({
    queryKey: ["inventorySearch", searchStr],
    queryFn: async () => {
      return searchInventory(searchStr);
    },
    enabled: false,
  });

  const handleInventorySearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="w-full p-4">
      <h1 className="text-2xl font-bold mb-4">AIM Inventory Management</h1>

      <form onSubmit={handleInventorySearch} className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Inventory Search</h2>
        <div className="flex gap-2">
          <Input
            className="max-w-md"
            type="text"
            value={searchStr}
            onChange={(e) => setSearchStr(e.target.value)}
            placeholder="Enter search string"
          />
          <Button type="submit" variant="linkHover1" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search Inventory"}
          </Button>
        </div>
      </form>

      {isLoading && <p>Loading...</p>}

      {error && <p className="text-red-500">{(error as Error).message}</p>}

      {inventorySearch &&
      inventorySearch.Records &&
      inventorySearch.Records.length > 0 ? (
        <div className="max-w-md">
          <h3 className="text-lg font-semibold mb-2">
            Inventory Search Result
          </h3>
          <ul className="space-y-4">
            {inventorySearch.Records.map((item, index) => (
              <li key={index} className="border p-4 rounded-md">
                <p>
                  <strong>Description:</strong> {item.Detail?.Description}
                </p>
                <p>
                  <strong>Manufacturer:</strong> {item.Detail?.Mfg}
                </p>
                <p>
                  <strong>Model:</strong> {item.Detail?.Model}
                </p>
                <p>
                  <strong>Category:</strong> {item.Detail?.CategoryDescription}
                </p>
                <p>
                  <strong>Subcategory:</strong>{" "}
                  {item.Detail?.SubCategoryDescription}
                </p>
                <p>
                  <strong>SKU:</strong> {item.Detail?.Sku}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        inventorySearch && <p>No results found.</p>
      )}
    </div>
  );
}
