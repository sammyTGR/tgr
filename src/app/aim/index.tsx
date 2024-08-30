"use client";

import React, { useState } from "react";
import { JsonServiceClient } from "@servicestack/client";
import {
  SearchInventoryRequest,
  SearchInventoryResponse,
} from "../api/aim/dtos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const client = new JsonServiceClient(
  "https://active-ewebservice.biz/aeservices30/api"
);

export default function AimPage() {
  const [searchStr, setSearchStr] = useState("");
  const [inventorySearch, setInventorySearch] =
    useState<SearchInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInventorySearch = async () => {
    try {
      setError(null);
      const request = new SearchInventoryRequest({
        ApiKey: process.env.ApiKey,
        OAuthToken: process.env.OAuthToken,
        AppId: process.env.AppId,
        Token: process.env.Token,
        SearchStr: searchStr,
        StartOffset: 0,
        RecordCount: 100,
      });

      const apiResponse = await client.post(request);
      setInventorySearch(apiResponse);
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
        <h2>Inventory Search</h2>
        <Input
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

      {inventorySearch && (
        <div className="max-w-md">
          <h3>Inventory Search Result</h3>
          <pre>{JSON.stringify(inventorySearch, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
