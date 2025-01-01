// TGR/dros/training/page.tsx
"use client";
import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";

// Define the JWT payload type
interface JWTPayload {
  aal: string;
  amr: Array<{ method: string; timestamp: number }>;
  app_metadata: {
    provider: string;
    providers: string[];
    role?: string;
  };
  aud: string;
  email: string;
  exp: number;
  iat: number;
  is_anonymous: boolean;
  iss: string;
  phone: string;
  role: string;
  session_id: string;
  sub: string;
  user_metadata: {
    avatar_url: string;
    email: string;
    email_verified: boolean;
    full_name: string;
    iss: string;
    name: string;
    phone_verified: boolean;
    picture: string;
    provider_id: string;
    sub: string;
    custom_claims: {
      hd: string;
    };
  };
}

const TransactionTypePage = () => {
  const router = useRouter();

  // Fetch user data using TanStack Query
  const { data: userData } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let userRole = "authenticated";
      if (session?.access_token) {
        const jwt = jwtDecode<JWTPayload>(session.access_token);
        // console.log("Decoded JWT:", jwt);
        userRole = jwt.app_metadata?.role || "authenticated";
      }

      // Set up auth state listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.access_token) {
          const jwt = jwtDecode<JWTPayload>(session.access_token);
          // console.log("Auth State Change - JWT:", jwt);
          userRole = jwt.app_metadata?.role || "authenticated";
        }
      });

      // Return user data with role
      const userData = {
        ...(session?.user || {}),
        decodedRole: userRole,
      };

      // Cleanup subscription
      subscription.unsubscribe();

      return userData;
    },
  });

  // Check the decoded role from JWT
  const userRole = userData?.decodedRole;
  const canReviewSubmissions = userRole === "admin" || userRole === "dev";

  // console.log("Final User Role:", userRole);
  // console.log("Can Review:", canReviewSubmissions);

  const handgunTransactions = [
    { title: "Dealer Handgun Sale", path: "/TGR/dros/training/dealerhandgun" },
    {
      title: "Private Party Handgun Transfer",
      path: "/TGR/dros/training/ppthandgun",
    },
    {
      title: "Peace Officer Non-Roster Handgun Private Party Transfer",
      path: "/TGR/dros/training/officerppthandgun",
    },
    {
      title: "Peace Officer Non-Roster Handgun Sale(Letter Required)",
      path: "/TGR/dros/training/officerhandgun",
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
              <Link href="/TGR/dros/training/review" className="w-full block">
                <Button variant="gooeyLeft" className="w-full">
                  Review Submissions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TransactionTypePage;
