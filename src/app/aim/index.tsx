"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default function AimPage() {
  const [searchStr, setSearchStr] = useState("");
  const [inventorySearch, setInventorySearch] = useState<any[]>([]); // Change to an array type
  const [error, setError] = useState<string | null>(null);

  const handleInventorySearch = async () => {
    try {
      setError(null);
      const requestBody = {
        SearchStr: searchStr,
      };

      // Hardcode the Username and Password for testing
      const username = "sxlee"; // Hardcoded Username
      const password = "Sl123456"; // Hardcoded Password

      // Encode the Username and Password into a single query parameter
      const queryParams = encodeURIComponent(
        `Username=${username}&Password=${password}`
      );

      // Make the fetch request to your API route with QueryParams
      const response = await fetch(
        `/api/proxy/searchInventory?QueryParams=${queryParams}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }

      const result = await response.json();
      setInventorySearch(result); // Set the results directly
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error searching inventory"
      );
      //console.(err);
    }
  };
  return (
    <div className="w-full p-4">
      <h1>AIM Inventory Management</h1>

      <div>
        <h2>Inventory Search</h2>
        <Input
          className="max-w-md p-2"
          type="text"
          value={searchStr}
          onChange={(e) => setSearchStr(e.target.value)}
          placeholder="Enter search string"
        />
        <Button variant="linkHover1" onClick={handleInventorySearch}>
          Search Inventory
        </Button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {inventorySearch.length > 0 && (
        <div className="max-w-md">
          <h3>Inventory Search Result</h3>
          <ul>
            {inventorySearch.map((item, index) => (
              <li key={index}>
                <strong>Description:</strong> {item.Description}
                <br />
                <strong>Manufacturer:</strong> {item.Manufacturer}
                <br />
                <strong>Model:</strong> {item.Model}
                <br />
                <strong>Category:</strong> {item.CategoryDescription}
                <br />
                <strong>Subcategory:</strong> {item.SubCategoryDescription}
                <br />
                <strong>SKU:</strong> {item.Sku}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
