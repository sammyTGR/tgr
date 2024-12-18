// TGR/dros/training/page.tsx
"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

const TransactionTypePage = () => {
  const router = useRouter();

  const handgunTransactions = [
    { title: "Dealer Handgun Sale", path: "/TGR/dros/training/dealerhandgun" },
    {
      title: "Private Party Handgun Transfer",
      path: "/dros/training/dros/privatehandgun",
    },
    {
      title: "Peace Officer Non-Roster Handgun Private Party Transfer",
      path: "/dros/training/dros/peaceofficerhandgun",
    },
    {
      title: "Peace Officer Non-Roster Handgun Sale(Letter Required)",
      path: "/dros/training/dros/peaceofficersale",
    },
    { title: "Exempt Handgun Sale", path: "/dros/training/dros/exempthandgun" },
    {
      title: "Pawn/Consignment Handgun Redemption",
      path: "/dros/training/dros/pawnhandgun",
    },
    {
      title: "Curio/Relic Handgun Sale",
      path: "/dros/training/dros/curiohandgun",
    },
    {
      title: "Olympic Pistol Sale",
      path: "/dros/training/dros/olympichandgun",
    },
    { title: "Handgun Loan", path: "/dros/training/dros/handgunloan" },
    {
      title: "Handgun Temporary Storage Return",
      path: "/dros/training/dros/handgunstorage",
    },
  ];

  const longGunTransactions = [
    {
      title: "Dealer Long Gun Sale",
      path: "/dros/training/dros/dealerlonggun",
    },
    {
      title: "Private Party Long Gun Transfer",
      path: "/dros/training/dros/privatelonggun",
    },
    {
      title: "Pawn/Consignment Long Gun Redemption",
      path: "/dros/training/dros/pawnlonggun",
    },
    {
      title: "Curio/Relic Long Gun Sale",
      path: "/dros/training/dros/curiolonggun",
    },
    { title: "Long Gun Loan", path: "/dros/training/dros/longgunloan" },
    {
      title: "Long Gun Temporary Storage Return",
      path: "/dros/training/dros/longgunstorage",
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
    </div>
  );
};

export default TransactionTypePage;
