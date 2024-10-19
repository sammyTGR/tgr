"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface InventoryItem {
  id: string;
  itemNumber: string;
  serial: string;
  manufacturer: string;
  model: string;
  type: string;
  caliber: string;
  location: string;
  condition: string;
  status: {
    id: number;
    name: string;
  };
}

interface InventoryResponse {
  items: InventoryItem[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  records: number;
  itemsPerPage: number;
}

interface SearchParams {
  search: string;
  itemNumber: string;
  serial: string;
  manufacturer: string;
  model: string;
  type: string;
  caliber: string;
  location: string;
  condition: string;
  status: string;
  page: number;
  itemsPerPage: number;
}

const initialSearchParams: SearchParams = {
  search: "",
  itemNumber: "",
  serial: "",
  manufacturer: "",
  model: "",
  type: "",
  caliber: "",
  location: "",
  condition: "",
  status: "",
  page: 1,
  itemsPerPage: 50,
};

const fetchInventory = async (
  searchParams: SearchParams
): Promise<InventoryResponse> => {
  const params = new URLSearchParams(
    Object.entries(searchParams).filter(([_, v]) => v !== "")
  );
  params.set("pageNumber", searchParams.page.toString());
  params.set("pageSize", searchParams.itemsPerPage.toString());
  const url = `/api/fastBoundApi/items?${params.toString()}`;

  console.log("Fetching inventory with params:", searchParams);
  console.log("API URL:", url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch inventory");
  }

  const data = await response.json();
  console.log("Received inventory data:", JSON.stringify(data, null, 2));

  // Ensure the response includes the necessary pagination information
  return {
    items: data.items || [],
    totalItems: data.totalItems || 0,
    currentPage: data.currentPage || searchParams.page,
    totalPages: data.totalPages || 1,
    records: data.records || 0,
    itemsPerPage: data.itemsPerPage || searchParams.itemsPerPage,
  };
};

const fetchManufacturers = async () => {
  const response = await fetch("/api/fastBoundApi/manufacturers");
  if (!response.ok) throw new Error("Failed to fetch manufacturers");
  return response.json();
};

const fetchCalibers = async () => {
  const response = await fetch("/api/fastBoundApi/calibers");
  if (!response.ok) throw new Error("Failed to fetch calibers");
  return response.json();
};

const fetchLocations = async () => {
  const response = await fetch("/api/fastBoundApi/locations");
  if (!response.ok) throw new Error("Failed to fetch locations");
  return response.json();
};

export function InventoryPageClient() {
  const queryClient = useQueryClient();

  const searchParamsQuery = useQuery({
    queryKey: ["searchParams"],
    queryFn: () => initialSearchParams,
    staleTime: Infinity,
  });

  const inventoryQuery = useQuery({
    queryKey: [
      "inventory",
      searchParamsQuery.data?.page,
      searchParamsQuery.data?.itemsPerPage,
      searchParamsQuery.data,
    ],
    queryFn: () =>
      fetchInventory(searchParamsQuery.data || initialSearchParams),
    enabled: false,
    placeholderData: keepPreviousData,
  });

  // Log the data when it changes
  if (inventoryQuery.data) {
    console.log("Current inventory data:", inventoryQuery.data);
  }

  const { data: manufacturers } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: fetchManufacturers,
  });

  const { data: calibers } = useQuery({
    queryKey: ["calibers"],
    queryFn: fetchCalibers,
  });

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
  });

  const updateSearchParams = (updates: Partial<SearchParams>) => {
    queryClient.setQueryData<SearchParams>(["searchParams"], (old) => {
      const newParams = { ...old!, ...updates };
      // Ensure all string fields have at least an empty string
      Object.keys(newParams).forEach((key) => {
        const typedKey = key as keyof SearchParams;
        if (
          typeof newParams[typedKey] === "string" &&
          newParams[typedKey] === undefined
        ) {
          (newParams[typedKey] as string) = "";
        }
      });
      return newParams;
    });
  };

  const handleSearch = () => {
    updateSearchParams({ page: 1 });
    inventoryQuery.refetch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchParams({ [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    updateSearchParams({ [name]: value });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (inventoryQuery.data?.totalPages || 1)) {
      return;
    }
    console.log("Changing to page:", newPage);
    queryClient.setQueryData<SearchParams>(["searchParams"], (old) => {
      const updatedParams = { ...old!, page: newPage };
      console.log("Updated search params:", updatedParams);
      return updatedParams;
    });
    inventoryQuery.refetch();
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    updateSearchParams({ itemsPerPage: newItemsPerPage, page: 1 });
    inventoryQuery.refetch();
  };

  const resetSearch = () => {
    queryClient.setQueryData<SearchParams>(
      ["searchParams"],
      initialSearchParams
    );
    inventoryQuery.refetch();
  };

  return (
    <div className="flex justify-center items-center mt-8 mx-auto max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] overflow-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Inventory Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Search form inputs */}
            {Object.entries(initialSearchParams).map(([key, value]) => {
              if (key === "page" || key === "itemsPerPage") return null;
              return (
                <div key={key}>
                  <Label htmlFor={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Label>
                  {key === "manufacturer" ||
                  key === "caliber" ||
                  key === "location" ||
                  key === "type" ||
                  key === "condition" ||
                  key === "status" ? (
                    <Select
                      onValueChange={(value) => handleSelectChange(key, value)}
                      value={
                        searchParamsQuery.data?.[
                          key as keyof SearchParams
                        ]?.toString() ?? ""
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${key}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {key === "manufacturer" &&
                          manufacturers?.map((item: string) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        {key === "caliber" &&
                          calibers?.map((item: string) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        {key === "location" &&
                          locations?.map((item: string) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        {key === "type" &&
                          [
                            "Pistol",
                            "Revolver",
                            "Rifle",
                            "Shotgun",
                            "Other",
                          ].map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        {key === "condition" &&
                          ["New", "Used"].map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        {key === "status" &&
                          [
                            { value: "1", label: "Available" },
                            { value: "2", label: "Pending Disposal" },
                            { value: "3", label: "Disposed" },
                            { value: "4", label: "Deleted" },
                          ].map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={key}
                      name={key}
                      value={
                        searchParamsQuery.data?.[key as keyof SearchParams] ??
                        ""
                      }
                      onChange={handleInputChange}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex space-x-4">
            <Button onClick={handleSearch}>Search Inventory</Button>
            <Button variant="outline" onClick={resetSearch}>
              Reset
            </Button>
          </div>
          {inventoryQuery.isLoading ? (
            <p>Loading...</p>
          ) : inventoryQuery.isError ? (
            <p>Error: {(inventoryQuery.error as Error).message}</p>
          ) : inventoryQuery.data ? (
            <div className="mt-4 text-left">
              <h3>Results: {inventoryQuery.data.records} items found</h3>
              {inventoryQuery.isFetching && <p>Updating...</p>}
              <ScrollArea>
                <div className="h-[calc(100vh-500px)] overflow-auto">
                  <table className="w-full h-full mt-2 overflow-hidden">
                    <thead>
                      <tr>
                        <th>Item Number</th>
                        <th>Serial</th>
                        <th>Manufacturer</th>
                        <th>Model</th>
                        <th>Type</th>
                        <th>Caliber</th>
                        <th>Location</th>
                        <th>Condition</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-left">
                      {inventoryQuery.data?.items.map((item, index) => (
                        <tr
                          key={`${inventoryQuery.data?.currentPage}-${item.id}-${item.itemNumber}`}
                        >
                          <td>{item.itemNumber}</td>
                          <td>{item.serial}</td>
                          <td>{item.manufacturer}</td>
                          <td>{item.model}</td>
                          <td>{item.type}</td>
                          <td>{item.caliber}</td>
                          <td>{item.location}</td>
                          <td>{item.condition}</td>
                          <td>{item.status.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={() =>
                    handlePageChange(
                      (inventoryQuery.data?.currentPage ?? 1) - 1
                    )
                  }
                  disabled={
                    (inventoryQuery.data?.currentPage ?? 1) <= 1 ||
                    inventoryQuery.isFetching
                  }
                >
                  Previous Page
                </Button>
                <span>
                  Page {inventoryQuery.data?.currentPage} of{" "}
                  {inventoryQuery.data?.totalPages}
                </span>
                <Button
                  onClick={() =>
                    handlePageChange(
                      (inventoryQuery.data?.currentPage ?? 1) + 1
                    )
                  }
                  disabled={
                    (inventoryQuery.data?.currentPage ?? 1) >=
                      (inventoryQuery.data?.totalPages ?? 1) ||
                    inventoryQuery.isFetching
                  }
                >
                  Next Page
                </Button>
              </div>
              <div className="mt-2">
                <Label htmlFor="itemsPerPage">Items per page:</Label>
                <Select
                  value={searchParamsQuery.data?.itemsPerPage.toString()}
                  onValueChange={(value) =>
                    handleItemsPerPageChange(parseInt(value, 10))
                  }
                >
                  <SelectTrigger id="itemsPerPage">
                    <SelectValue placeholder="Select items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-left">
              <h3>No results found</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InventoryPageClient;
