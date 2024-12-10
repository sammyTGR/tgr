//returns results but not the correct ones
"use client";

import { useCallback } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SearchFields,
  AcquisitionFields,
  DispositionFields,
  StatusFields,
} from "./components/index";
import type { SearchParams, InventoryItem, InventoryResponse } from "./types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialSearchParams: SearchParams & { searchTriggered: boolean } = {
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
  skip: 0,
  take: 10,
  disposedStatus: "3", // "Both"
  deletedStatus: "1", // "Not Deleted Only"
  doNotDisposeStatus: "1", // "Not Do Not Dispose Only"
  searchTriggered: false,
};

const fetchInventory = async (searchParams: SearchParams) => {
  const queryParams = new URLSearchParams();
  const searchTerms = [];

  // Handle basic search fields
  const basicFields = {
    model: "Model",
    manufacturer: "Manufacturer",
    type: "Type",
    caliber: "Caliber",
    location: "Location",
    condition: "Condition",
    serial: "Serial",
    itemNumber: "ItemNumber",
  };

  // Only add non-empty search terms
  Object.entries(basicFields).forEach(([key, fbKey]) => {
    const value = searchParams[key as keyof SearchParams];
    if (value && typeof value === "string" && value.trim() !== "") {
      searchTerms.push(`${fbKey}:"${value.trim()}"`);
    }
  });

  // Handle status filters - only add if they're not "3" (Both)
  if (searchParams.deletedStatus && searchParams.deletedStatus !== "3") {
    searchTerms.push(`Deleted:${searchParams.deletedStatus === "2"}`);
  }

  if (searchParams.disposedStatus && searchParams.disposedStatus !== "3") {
    searchTerms.push(`Disposed:${searchParams.disposedStatus === "2"}`);
  }

  if (
    searchParams.doNotDisposeStatus &&
    searchParams.doNotDisposeStatus !== "3"
  ) {
    searchTerms.push(`DoNotDispose:${searchParams.doNotDisposeStatus === "2"}`);
  }

  // Handle date ranges - only add if they have values
  if (searchParams.acquiredOnAfter?.trim()) {
    searchTerms.push(`AcquireDate:>="${searchParams.acquiredOnAfter.trim()}"`);
  }
  if (searchParams.acquiredOnBefore?.trim()) {
    searchTerms.push(`AcquireDate:<="${searchParams.acquiredOnBefore.trim()}"`);
  }
  if (searchParams.disposedOnAfter?.trim()) {
    searchTerms.push(`DisposeDate:>="${searchParams.disposedOnAfter.trim()}"`);
  }
  if (searchParams.disposedOnBefore?.trim()) {
    searchTerms.push(`DisposeDate:<="${searchParams.disposedOnBefore.trim()}"`);
  }

  // Handle other fields - only add if they have non-empty values
  if (searchParams.acquiredType?.trim()) {
    searchTerms.push(`AcquisitionType:"${searchParams.acquiredType.trim()}"`);
  }

  if (searchParams.disposedType?.trim()) {
    searchTerms.push(`DispositionType:"${searchParams.disposedType.trim()}"`);
  }

  // Handle contact fields - only add if they have non-empty values
  if (searchParams.acquiredFromLicenseName?.trim()) {
    searchTerms.push(
      `AcquisitionContactName:"${searchParams.acquiredFromLicenseName.trim()}"`
    );
  }
  if (searchParams.acquiredFromFFLNumber?.trim()) {
    searchTerms.push(
      `AcquisitionContactFFLNumber:"${searchParams.acquiredFromFFLNumber.trim()}"`
    );
  }
  if (searchParams.disposedToLicenseName?.trim()) {
    searchTerms.push(
      `DispositionContactName:"${searchParams.disposedToLicenseName.trim()}"`
    );
  }
  if (searchParams.disposedToFFLNumber?.trim()) {
    searchTerms.push(
      `DispositionContactFFLNumber:"${searchParams.disposedToFFLNumber.trim()}"`
    );
  }

  // Add the combined search terms only if there are any
  if (searchTerms.length > 0) {
    queryParams.set("search", searchTerms.join(" AND "));
  }

  // Add pagination parameters
  queryParams.set("skip", searchParams.skip.toString());
  queryParams.set("take", searchParams.take.toString());

  console.log("Search terms:", searchTerms); // Debug log
  console.log("Query params:", queryParams.toString()); // Debug log

  // Make GET request
  const response = await fetch(
    `/api/fastBoundApi/items?${queryParams.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || "Failed to fetch inventory");
  }

  return response.json();
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

function InventoryPage() {
  const queryClient = useQueryClient();

  const searchParamsQuery = useQuery({
    queryKey: ["searchParams"],
    queryFn: () => ({ ...initialSearchParams, searchTriggered: false }),
    staleTime: Infinity,
  });

  const inventoryQuery = useQuery({
    queryKey: ["inventory", searchParamsQuery.data],
    queryFn: () => fetchInventory(searchParamsQuery.data!),
    enabled: !!searchParamsQuery.data,
    placeholderData: keepPreviousData,
  });

  // Handle warning separately
  if (inventoryQuery.data?.warning) {
    console.warn("API Warning:", inventoryQuery.data.warning);
  }

  const handlePageChange = (newPage: number) => {
    const newSkip = (newPage - 1) * (searchParamsQuery.data?.take || 10);
    updateSearchParams({
      skip: newSkip,
      searchTriggered: true,
    });
    inventoryQuery.refetch();
  };

  console.log("Current search params:", searchParamsQuery.data);
  console.log("Current inventory data:", inventoryQuery.data);

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

  const updateSearchParams = (
    updates: Partial<SearchParams> & { searchTriggered?: boolean }
  ) => {
    queryClient.setQueryData<SearchParams & { searchTriggered: boolean }>(
      ["searchParams"],
      (old) => ({
        ...old!,
        ...updates,
        // Only override searchTriggered if explicitly provided
        searchTriggered:
          typeof updates.searchTriggered === "boolean"
            ? updates.searchTriggered
            : old?.searchTriggered ?? false,
      })
    );
  };

  const handleSearch = () => {
    updateSearchParams({ skip: 0, searchTriggered: true });
    inventoryQuery.refetch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchParams({ [e.target.name]: e.target.value, skip: 0 });
  };

  const handleSelectChange = (name: string, value: string) => {
    updateSearchParams({ [name]: value, skip: 0 });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    updateSearchParams({
      take: newItemsPerPage,
      skip: 0,
      searchTriggered: true,
    });
    inventoryQuery.refetch();
  };

  const resetSearch = () => {
    queryClient.setQueryData<SearchParams & { searchTriggered: boolean }>(
      ["searchParams"],
      { ...initialSearchParams, searchTriggered: false }
    );
    queryClient.removeQueries({ queryKey: ["inventory"] });
    console.log(
      "Reset search params:",
      queryClient.getQueryData(["searchParams"])
    );
    console.log(
      "Reset inventory data:",
      queryClient.getQueryData(["inventory"])
    );
  };

  const currentPage =
    Math.floor(
      (searchParamsQuery.data?.skip || 0) / (searchParamsQuery.data?.take || 10)
    ) + 1;
  const totalPages = Math.min(
    Math.ceil(
      (inventoryQuery.data?.records || 0) / (searchParamsQuery.data?.take || 10)
    ),
    Math.ceil(100 / (searchParamsQuery.data?.take || 10))
  );

  // Add search strategy hints
  const showSearchHints =
    inventoryQuery.data?.records && inventoryQuery.data.records > 100;

  return (
    <div className="flex justify-center items-center mt-8 mx-auto max-w-[calc(100vw-100px)] overflow-hidden">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Inventory Search</CardTitle>
          {showSearchHints && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Search Results Exceeded 100 Items</AlertTitle>
              <AlertDescription>
                To find specific items, try using the advanced search options in
                the tabs below.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Search</TabsTrigger>
              <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
              <TabsTrigger value="disposition">Disposition</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <SearchFields
                searchParams={searchParamsQuery.data}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
                manufacturers={manufacturers}
                calibers={calibers}
                locations={locations}
              />
            </TabsContent>

            <TabsContent value="acquisition">
              <AcquisitionFields
                searchParams={searchParamsQuery.data}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
              />
            </TabsContent>

            <TabsContent value="disposition">
              <DispositionFields
                searchParams={searchParamsQuery.data}
                onInputChange={handleInputChange}
                onSelectChange={handleSelectChange}
              />
            </TabsContent>
          </Tabs>

          <div className="flex space-x-4 mt-4">
            <Button onClick={handleSearch}>Search Inventory</Button>
            <Button variant="outline" onClick={resetSearch}>
              Reset
            </Button>
          </div>

          {inventoryQuery.isLoading ? (
            <p>Loading...</p>
          ) : inventoryQuery.isError ? (
            <p>Error: {(inventoryQuery.error as Error).message}</p>
          ) : inventoryQuery.data && searchParamsQuery.data?.searchTriggered ? (
            <div className="mt-4 text-left">
              <h3>Results: {inventoryQuery.data.records} items found</h3>
              {inventoryQuery.isFetching && <p>Updating...</p>}
              <ScrollArea>
                <div className="h-[calc(100vh-700px)] overflow-auto">
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
                      {inventoryQuery.data?.items.map(
                        (item: InventoryItem, index: number) => (
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
                        )
                      )}
                    </tbody>
                  </table>
                </div>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || inventoryQuery.isFetching}
                >
                  Previous Page
                </Button>
                <span>
                  Page {currentPage} of {totalPages}{" "}
                  {inventoryQuery.data?.records > 100 && (
                    <span className="text-sm text-amber-600">
                      (Limited to first 100 results)
                    </span>
                  )}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage >= totalPages ||
                    inventoryQuery.isFetching ||
                    (searchParamsQuery.data?.skip || 0) +
                      (searchParamsQuery.data?.take || 10) >=
                      100
                  }
                >
                  Next Page
                </Button>
              </div>
              <div className="mt-2">
                <Label htmlFor="itemsPerPage">Items per page:</Label>
                <Select
                  value={searchParamsQuery.data?.take.toString()}
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
              {inventoryQuery.data?.warning && (
                <div className="mt-4 text-amber-600">
                  Warning: {inventoryQuery.data.warning}
                </div>
              )}
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

export default InventoryPage;
