"use client";

import React, { useState } from "react";
import type {
  InventoryDetailResponse,
  InventoryLookupResponse,
} from "../api/aim/dtos";

export default function AimPage() {
  const [model, setModel] = useState("");
  const [item, setItem] = useState("");
  const [locationCode, setLocationCode] = useState("");
  const [inventoryDetail, setInventoryDetail] =
    useState<InventoryDetailResponse | null>(null);
  const [inventoryLookup, setInventoryLookup] =
    useState<InventoryLookupResponse | null>(null);
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
        `/api/inventory?action=lookup&item=${encodeURIComponent(
          item
        )}&locationCode=${encodeURIComponent(locationCode)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Network response was not ok");
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">AIM Inventory Management</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Inventory Detail</h2>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Enter model"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleInventoryDetail}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Get Inventory Detail
        </button>
        {inventoryDetail && (
          <pre className="mt-4 bg-gray-100 p-4 rounded">
            {JSON.stringify(inventoryDetail, null, 2)}
          </pre>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Inventory Lookup</h2>
        <input
          type="text"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Enter item"
          className="border p-2 mr-2"
        />
        <input
          type="text"
          value={locationCode}
          onChange={(e) => setLocationCode(e.target.value)}
          placeholder="Enter location code"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleInventoryLookup}
          className="bg-green-500 text-white p-2 rounded"
        >
          Lookup Inventory
        </button>
        {inventoryLookup && (
          <pre className="mt-4 bg-gray-100 p-4 rounded">
            {JSON.stringify(inventoryLookup, null, 2)}
          </pre>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
