"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const supabase = createClientComponentClient();

interface AcquisitionItem {
  manufacturer: string;
  countryOfManufacture: string;
  model: string;
  serial: string;
  caliber: string;
  type: string;
}

const createAcquisition = async (items: AcquisitionItem[]) => {
  try {
    const response = await fetch("/api/fastBoundApi/acquisitions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API response error:", errorData);
      throw new Error(
        errorData.error ||
          `Failed to create acquisition: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Error in createAcquisition:", error);
    throw error;
  }
};

export default function Acquisitions() {
  const [items, setItems] = useState<AcquisitionItem[]>([]);
  const [newItem, setNewItem] = useState<AcquisitionItem>({
    manufacturer: "",
    countryOfManufacture: "",
    model: "",
    serial: "",
    caliber: "",
    type: "",
  });

  const mutation = useMutation({
    mutationFn: createAcquisition,
    onSuccess: () => {
      setItems([]);
      setNewItem({
        manufacturer: "",
        countryOfManufacture: "",
        model: "",
        serial: "",
        caliber: "",
        type: "",
      });
    },
  });

  const handleAddItem = () => {
    setItems([...items, newItem]);
    setNewItem({
      manufacturer: "",
      countryOfManufacture: "",
      model: "",
      serial: "",
      caliber: "",
      type: "",
    });
  };

  const handleSubmit = () => {
    mutation.mutate(items);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Acquisition</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={newItem.manufacturer}
                onChange={(e) =>
                  setNewItem({ ...newItem, manufacturer: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="countryOfManufacture">
                Country of Manufacture
              </Label>
              <Input
                id="countryOfManufacture"
                value={newItem.countryOfManufacture}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    countryOfManufacture: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={newItem.model}
                onChange={(e) =>
                  setNewItem({ ...newItem, model: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="serial">Serial</Label>
              <Input
                id="serial"
                value={newItem.serial}
                onChange={(e) =>
                  setNewItem({ ...newItem, serial: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="caliber">Caliber</Label>
              <Input
                id="caliber"
                value={newItem.caliber}
                onChange={(e) =>
                  setNewItem({ ...newItem, caliber: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                value={newItem.type}
                onChange={(e) =>
                  setNewItem({ ...newItem, type: e.target.value })
                }
              />
            </div>
          </div>
          <Button onClick={handleAddItem}>Add Item</Button>
        </div>
        <div className="mt-4">
          <h3>Items to Acquire:</h3>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                {item.manufacturer} - {item.model} - {item.serial}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={handleSubmit} className="mt-4">
          Submit Acquisition
        </Button>
        {mutation.isSuccess && <p>Acquisition created successfully!</p>}
        {mutation.isError && (
          <p>Error creating acquisition: {mutation.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
