"use client";
import React from "react";
import Link from "next/link";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import {
  AdminReviewAuditsCard,
  DrosGuidanceCard,
  AdminSubmitAuditsCard,
  AdminTimeOffReviewCard,
  TimeOffRequestCard,
  GeneratorCard,
  WaiverCard,
  OrderCard,
  DepositsCard,
} from "@/components/LandingCards";
import { Separator } from "./ui/separator";
import { useRole } from "../context/RoleContext";
import { Button } from "./ui/button";
import Image from "next/image";

const words = "Ops Management Dashboard";
const subwords = "Weekly Checks For 9MM Quality Control";

const LandingPageSuperAdmin: React.FC = React.memo(() => {
  const { role } = useRole();

  if (role !== "super admin") {
    return (
      <div>
        <h1>You must be signed in to view this page.</h1>
        <Link href="/sign-in">
          <Button>Sign In</Button>
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
      <section className="w-full py-12 md:py-6">
        <div className="container px-4 md:px-6">
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 md:grid-cols-2">
            <div className="col-span-full flex justify-center">
              <DepositsCard />
            </div>
            <Separator />
            <Separator />
            <AdminReviewAuditsCard />
            <AdminSubmitAuditsCard />
            <DrosGuidanceCard />
            <TimeOffRequestCard />
            <AdminTimeOffReviewCard />
            <GeneratorCard />
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

LandingPageSuperAdmin.displayName = "LandingPageSuperAdmin";

export default LandingPageSuperAdmin;
