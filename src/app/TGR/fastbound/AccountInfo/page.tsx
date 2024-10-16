"use client";

import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AccountResponse {
  number: number;
  name: string;
  itemsInInventory: number;
  owner: {
    licenseName: string;
    tradeName: string;
    fflNumber: string;
    fflExpires: string;
  };
  // Add other properties as needed
}

const supabase = createClientComponentClient();

const fetchAccountInfo = async (): Promise<AccountResponse> => {
  const response = await fetch("/api/fastBoundApi");
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch account information");
  }
  return response.json();
};

export default function AccountInfo() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const {
    data: accountInfo,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AccountResponse, Error>({
    queryKey: ["accountInfo"],
    queryFn: fetchAccountInfo,
    enabled: !!user,
  });

  if (!user) {
    return <div>Please sign in to view account information.</div>;
  }

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent>
        {accountInfo && (
          <>
            <p>Account Number: {accountInfo.number}</p>
            <p>Name: {accountInfo.name}</p>
            <p>Items in Inventory: {accountInfo.itemsInInventory}</p>
            <h3>Owner Information</h3>
            <p>License Name: {accountInfo.owner.licenseName}</p>
            <p>Trade Name: {accountInfo.owner.tradeName}</p>
            <p>FFL Number: {accountInfo.owner.fflNumber}</p>
            <p>
              FFL Expires:{" "}
              {new Date(accountInfo.owner.fflExpires).toLocaleDateString()}
            </p>
          </>
        )}
        <Button onClick={() => refetch()}>Refresh</Button>
      </CardContent>
    </Card>
  );
}
