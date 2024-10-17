"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
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
  records: number;
  manufacturers: string[];
  locations: string[];
  calibers: string[];
  currentPage: number;
  totalPages: number;
}

const fetchInventory = async (
  queryParams: Record<string, string>,
  page: number = 1
) => {
  const params = new URLSearchParams(queryParams);
  params.append("page", page.toString());
  const response = await fetch(`/api/fastBoundApi/items?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch inventory");
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

export default function InventoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
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

  const { data, isLoading, error, refetch } = useQuery<InventoryResponse>({
    queryKey: ["inventory", searchParams, currentPage],
    queryFn: () =>
      fetchInventory({ ...searchParams, page: currentPage.toString() }),
    enabled: false,
    placeholderData: keepPreviousData,
  });

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
    setCurrentPage(1); // Reset to first page when searching
    refetch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setSearchParams({ ...searchParams, [name]: value });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    refetch();
  };

  return (
    <div className="flex justify-center items-center mt-8 mx-auto max-w-[calc(100vw-100px)] max-h-[calc(100vh-100px)]overflow-auto">
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
            <Button
              variant="outline"
              onClick={() => {
                setSearchParams({
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
              }}
            >
              Reset
            </Button>
          </div>
          {isLoading && <p>Loading...</p>}
          {error && <p>Error: {(error as Error).message}</p>}
          {data && (
            <div className="mt-4 text-left">
              <h3>Results: {data.records} items found</h3>
              <ScrollArea>
                <div className="max-h-[calc(100vh-600px)]">
                  <table className="w-full mt-2 overflow-hidden">
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
                      {data.items.map((item) => (
                        <tr key={item.itemNumber}>
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous Page
                </Button>
                <span>
                  Page {data.currentPage} of {data.totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === data.totalPages}
                >
                  Next Page
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
