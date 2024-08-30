"use client";

import React, { useState } from "react";
import type {
  InventoryDetailResponse,
  InventoryLookupResponse,
  SearchInventoryResponse,
} from "../api/aim/dtos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AimPage() {
  const [model, setModel] = useState("");
  const [item, setItem] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [searchStr, setSearchStr] = useState("");
  const [inventoryDetail, setInventoryDetail] = useState<InventoryDetailResponse | null>(null);
  const [inventoryLookup, setInventoryLookup] = useState<InventoryLookupResponse | null>(null);
  const [inventorySearch, setInventorySearch] = useState<SearchInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInventoryDetail = async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/inventory?action=detail&model=${encodeURIComponent(model)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }
      const result = await response.json();
      setInventoryDetail(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error fetching inventory detail"
      );
      console.error(err);
    }
  };

  const handleInventoryLookup = async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/inventory?action=lookup&item=${encodeURIComponent(item)}&locationCode=${encodeURIComponent(locationCode)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }
      const result = await response.json();
      setInventoryLookup(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error looking up inventory"
      );
      console.error(err);
    }
  };

  const handleInventorySearch = async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/inventory?action=search&searchStr=${encodeURIComponent(searchStr)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }
      const result = await response.json();
      setInventorySearch(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error searching inventory"
      );
      console.error(err);
    }
  };

  return (
    <div>
      <h1>AIM Inventory Management</h1>

      <div>
        <h2>Inventory Detail</h2>
        <Input
          className="max-w-md"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model"
        />
        <Button variant="linkHover1" onClick={handleInventoryDetail}>Get Inventory Detail</Button>
      </div>

      <div>
        <h2>Inventory Lookup</h2>
        <Input
          className="max-w-md"
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Enter item"
        />
        <Input
          type="text"
          value={locationCode}
          onChange={(e) => setLocationCode(e.target.value)}
          placeholder="Enter location code (optional)"
        />
        <Button variant="linkHover1" onClick={handleInventoryLookup}>Lookup Inventory</Button>
      </div>

      <div>
        <h2>Inventory Search</h2>
        <Input
          type="text"
          value={searchStr}
          onChange={(e) => setSearchStr(e.target.value)}
          placeholder="Enter search string"
        />
        <Button variant="linkHover1" onClick={handleInventorySearch}>Search Inventory</Button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {inventoryDetail && (
        <div className="max-w-md">
          <h3>Inventory Detail Result</h3>
          <pre>{JSON.stringify(inventoryDetail, null, 2)}</pre>
        </div>
      )}

<div className="max-w-md">
      {inventoryLookup && (
        <div>
          <h3>Inventory Lookup Result</h3>
          <pre>{JSON.stringify(inventoryLookup, null, 2)}</pre>
        </div>
      )}
      </div>

      {inventorySearch && (
        <div className="max-w-md">
          <h3>Inventory Search Result</h3>
          <pre>{JSON.stringify(inventorySearch, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
