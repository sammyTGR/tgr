"use client";
import Link from "next/link";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import {
  ActivityLogIcon,
  LightningBoltIcon,
  TextIcon,
} from "@radix-ui/react-icons";
import { AdminReviewAuditsCard, DrosGuidanceCard, AdminSubmitAuditsCard, AdminTimeOffReviewCard } from "@/components/LandingCards";

const words = "Admin Dashboard";
const subwords = "Time To Put In WORK";

export default function LandingPageAdmin() {
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
            <DrosGuidanceCard />
            <AdminSubmitAuditsCard />
            <AdminTimeOffReviewCard />
          </div>
        </div>
      </section>
    </>
  );
}
