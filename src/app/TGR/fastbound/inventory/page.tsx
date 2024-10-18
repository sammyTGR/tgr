//// almost working version just doesnt show next page results
"use client";

import { useState, useMemo } from "react";
import {
  useQuery,
  keepPreviousData,
  useQueryClient,
  useInfiniteQuery,
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
  id: string; // FastBound ID
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

const lastRequestTime = { time: Date.now() };
const requestCount = { count: 0 };

const fetchInventory = async (
  searchParams: Record<string, string>,
  page: number,
  itemsPerPage: number
): Promise<InventoryResponse> => {
  // Implement rate limiting
  const now = Date.now();
  if (now - lastRequestTime.time >= 60000) {
    requestCount.count = 0;
    lastRequestTime.time = now;
  }

  if (requestCount.count >= 60) {
    const waitTime = 60000 - (now - lastRequestTime.time);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    requestCount.count = 0;
    lastRequestTime.time = Date.now();
  }

  requestCount.count++;

  const params = new URLSearchParams(searchParams);
  params.set("page", page.toString());
  params.set("itemsPerPage", itemsPerPage.toString());
  const url = `/api/fastBoundApi/items?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "X-AuditUser": process.env.NEXT_PUBLIC_FASTBOUND_AUDIT_USER || "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch inventory");
  }

  const data = await response.json();
  // console.log("Fetched inventory data:", data); // Add this line

  if (response.headers.get("X-FastBound-MultipleSale") === "true") {
    const multipleSaleUrl = response.headers.get("X-FastBound-MultipleSaleUrl");
    console.warn("Multiple sale report generated:", multipleSaleUrl);
    // Display this warning to the user in your UI
  }

  return data;
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

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({
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
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const inventoryQuery = useInfiniteQuery({
    queryKey: ["inventory", searchParams],
    queryFn: ({ pageParam = 1 }) =>
      fetchInventory(searchParams, pageParam as number, itemsPerPage),
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    getPreviousPageParam: (firstPage, allPages) => {
      return allPages.length > 1 ? allPages.length - 1 : undefined;
    },
    enabled: false,
    initialPageParam: 1,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const allItems = useMemo(() => {
    return inventoryQuery.data?.pages.flatMap((page) => page.items) || [];
  }, [inventoryQuery.data]);

  const totalPages = useMemo(() => {
    return inventoryQuery.data?.pages[0]?.totalPages || 1;
  }, [inventoryQuery.data]);

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

  const handleSearch = () => {
    inventoryQuery.refetch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setSearchParams({ ...searchParams, [name]: value });
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) {
      return;
    }
    setCurrentPage(newPage);
    if (newPage > (inventoryQuery.data?.pages[0].totalPages || 1)) {
      await inventoryQuery.fetchNextPage();
      queryClient.invalidateQueries({ queryKey: ["inventory", searchParams] });
    }
  };

  const handleItemsPerPage = (newItemsPerPage: number) => {
    setSearchParams((prevParams) => ({
      ...prevParams,
      itemsPerPage: newItemsPerPage.toString(),
    }));
    inventoryQuery.refetch();
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    queryClient.setQueryData(["inventory", searchParams], (oldData: any) => ({
      ...oldData,
      itemsPerPage: newItemsPerPage,
    }));
    inventoryQuery.refetch();
  };

  const resetSearch = () => {
    const emptySearchParams = {
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
    };

    // Reset the form fields
    setSearchParams(emptySearchParams);

    // Reset the current page
    inventoryQuery.refetch();

    // Clear the query cache for inventory
    queryClient.removeQueries({ queryKey: ["inventory"] });

    // Set the query data to null
    queryClient.setQueryData(["inventory", emptySearchParams, 1], null);

    // Disable the query to prevent automatic refetching
    queryClient.setQueryDefaults(["inventory"], { enabled: false });

    // Force a re-render to clear the table
    inventoryQuery.refetch();
  };

  return (
    <div className="flex justify-center items-center mt-8 mx-auto max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)] overflow-auto">
      <Card className="w-full ">
        <CardHeader>
          <CardTitle>Inventory Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="search">General Search</Label>
              <Input
                id="search"
                name="search"
                value={searchParams.search}
                onChange={handleInputChange}
                placeholder="Search all fields"
              />
            </div>
            <div>
              <Label htmlFor="itemNumber">Item Number</Label>
              <Input
                id="itemNumber"
                name="itemNumber"
                value={searchParams.itemNumber}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="serial">Serial</Label>
              <Input
                id="serial"
                name="serial"
                value={searchParams.serial}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("manufacturer", value)
                }
                value={searchParams.manufacturer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers?.map((manufacturer: string) => (
                    <SelectItem key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                value={searchParams.model}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                onValueChange={(value) => handleSelectChange("type", value)}
                value={searchParams.type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pistol">Pistol</SelectItem>
                  <SelectItem value="Revolver">Revolver</SelectItem>
                  <SelectItem value="Rifle">Rifle</SelectItem>
                  <SelectItem value="Shotgun">Shotgun</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="caliber">Caliber</Label>
              <Select
                onValueChange={(value) => handleSelectChange("caliber", value)}
                value={searchParams.caliber}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select caliber" />
                </SelectTrigger>
                <SelectContent>
                  {calibers?.map((caliber: string) => (
                    <SelectItem key={caliber} value={caliber}>
                      {caliber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                onValueChange={(value) => handleSelectChange("location", value)}
                value={searchParams.location}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location: string) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("condition", value)
                }
                value={searchParams.condition}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => handleSelectChange("status", value)}
                value={searchParams.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Available</SelectItem>
                  <SelectItem value="2">Pending Disposal</SelectItem>
                  <SelectItem value="3">Disposed</SelectItem>
                  <SelectItem value="4">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          ) : inventoryQuery.data && inventoryQuery.data.pages.length > 0 ? (
            <div className="mt-4 text-left">
              <h3>
                Results: {inventoryQuery.data.pages[0].records} items found
              </h3>
              {inventoryQuery.isFetching && <p>Updating...</p>}
              <ScrollArea className="h-[calc(100vh-500px)]">
                <table className="w-full mt-2">
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
                    {allItems
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((item) => (
                        <tr key={`${item.id}-${item.itemNumber}`}>
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
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || inventoryQuery.isFetching}
                >
                  Previous Page
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage === totalPages || inventoryQuery.isFetching
                  }
                >
                  Next Page
                </Button>
              </div>
              <div className="mt-2">
                <Label htmlFor="itemsPerPage">Items per page:</Label>
                <Select
                  value={inventoryQuery.data.pages[0].itemsPerPage.toString()}
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
