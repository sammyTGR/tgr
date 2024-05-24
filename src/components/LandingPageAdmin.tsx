"use client";
import Link from "next/link";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import {
  ActivityLogIcon,
  LightningBoltIcon,
  TextIcon,
} from "@radix-ui/react-icons";

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
          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 md:grid-cols-3">
            <Link className="group" href="/auditreview">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <ActivityLogIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <CardTitle>Review Your Audits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    Verify All Submitted Audits By The Team
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link className="group" href="/audits/drosguide">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <LightningBoltIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <CardTitle>DROS Guidance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    Stay In The Know With DROS Requirements
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link className="group" href="/audits/submit">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <TextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <CardTitle>Enter Audits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    Utilize The Helper Floating Menu Bar During Your Audits
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
