// TGR/dros/training/page.tsx
"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

const TransactionTypePage = () => {
  const router = useRouter();

  // Fetch user data using TanStack Query
  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const userRole = userData?.app_metadata?.role;
  const canReviewSubmissions = userRole === "admin" || userRole === "dev";

  const handgunTransactions = [
    { title: "Dealer Handgun Sale", path: "/TGR/dros/training/dealerhandgun" },
    {
      title: "Private Party Handgun Transfer",
      path: "/TGR/dros/training/ppthandgun",
    },
    {
      title: "Peace Officer Non-Roster Handgun Private Party Transfer",
      path: "/TGR/dros/training/peaceofficerhandgun",
    },
    {
      title: "Peace Officer Non-Roster Handgun Sale(Letter Required)",
      path: "/TGR/dros/training/peaceofficersale",
    },
    { title: "Exempt Handgun Sale", path: "/TGR/dros/training/exempthandgun" },
    {
      title: "Pawn/Consignment Handgun Redemption",
      path: "/TGR/dros/training/pawnhandgun",
    },
    {
      title: "Curio/Relic Handgun Sale",
      path: "/TGR/dros/training/curiohandgun",
    },
    {
      title: "Olympic Pistol Sale",
      path: "/TGR/dros/training/olympichandgun",
    },
    { title: "Handgun Loan", path: "/TGR/dros/training/handgunloan" },
    {
      title: "Handgun Temporary Storage Return",
      path: "/TGR/dros/training/handgunstorage",
    },
  ];

  const longGunTransactions = [
    {
      title: "Dealer Long Gun Sale",
      path: "/TGR/dros/training/dealerlonggun",
    },
    {
      title: "Private Party Long Gun Transfer",
      path: "/TGR/dros/training/privatelonggun",
    },
    {
      title: "Pawn/Consignment Long Gun Redemption",
      path: "/TGR/dros/training/pawnlonggun",
    },
    {
      title: "Curio/Relic Long Gun Sale",
      path: "/TGR/dros/training/curiolonggun",
    },
    { title: "Long Gun Loan", path: "/TGR/dros/training/longgunloan" },
    {
      title: "Long Gun Temporary Storage Return",
      path: "/TGR/dros/training/longgunstorage",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8 ">
        Select Transaction Type
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Handgun Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl ">Handgun Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {handgunTransactions.map((transaction, index) => (
                <li key={index}>
                  <button
                    onClick={() => router.push(transaction.path)}
                    className="w-full text-left p-2 hover:bg-muted rounded hover:underline"
                  >
                    {transaction.title}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Long Gun Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl ">Long Gun Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {longGunTransactions.map((transaction, index) => (
                <li key={index}>
                  <button
                    onClick={() => router.push(transaction.path)}
                    className="w-full text-left p-2 hover:bg-muted rounded hover:underline"
                  >
                    {transaction.title}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Review Submissions */}
      {canReviewSubmissions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Review Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/TGR/dros/training/review">Review Submissions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TransactionTypePage;
