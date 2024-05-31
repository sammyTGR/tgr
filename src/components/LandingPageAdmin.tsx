"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import {
  AdminReviewAuditsCard,
  DrosGuidanceCard,
  AdminSubmitAuditsCard,
  AdminTimeOffReviewCard,
  TimeOffRequestCard,
  WaiverCard,
  OrderCard,
} from "@/components/LandingCards";
import { Separator } from "./ui/separator";
import { supabase } from "@/utils/supabase/client";

const words = "Admin Dashboard";
const subwords = "Time To Manage";

const LandingPageAdmin: React.FC = React.memo(() => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div>
        <h1>You must be signed in to view this page.</h1>
        <Link href="/sign-in">
          <a>Sign In</a>
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="w-full py-12 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              <TextGenerateEffect words={words} />
            </h1>
            <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
              <TextGenerateEffect words={subwords} />
            </p>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 md:grid-cols-2">
          <div className="col-span-full flex justify-center">
              <DrosGuidanceCard />
            </div>
            <AdminReviewAuditsCard />
            <AdminSubmitAuditsCard />
            <TimeOffRequestCard />
            <AdminTimeOffReviewCard />
            <Separator />
            <Separator />
            <WaiverCard />
            <OrderCard />
          </div>
        </div>
      </section>
    </>
  );
});

LandingPageAdmin.displayName = "LandingPageAdmin";

export default LandingPageAdmin;
