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

const words = "Ops Management Dashboard";
const subwords = "Fuck You Chris";

const LandingPageSuperAdmin: React.FC = React.memo(() => {
  const { role } = useRole();

  if (role !== "super admin") {
    return (
      <div>
        <h1>You must be signed in to view this page.</h1>
        <Link href="/auth">
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
            <Separator />
            <Separator />
            <div className="col-span-full flex justify-center">
              <DepositsCard />
            </div>
          </div>
        </div>
      </section>
    </>
  );
});

LandingPageSuperAdmin.displayName = "LandingPageSuperAdmin";

export default LandingPageSuperAdmin;
