"use client";
import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import { TextGenerateColor } from "./ui/text-generate-color";
import { TracingBeam } from "./ui/tracing-beam";

const title = "The Gun Range";
const sub = "Your One Stop Shop For All Of Your Shooting Needs";

const LandingPagePublic: React.FC = React.memo(() => {
  return (
    <div className="flex flex-col min-h-[100vh]">
      <main className="flex-1">
        <TracingBeam className="w-full py-12 md:py-24 lg:py-32 border-y">
          <div className="flex items-center justify-center py-6 md:py-6 lg:py-12">
            <div className="w-full max-w-xl">
              <Image
                src="/TestBanner.png"
                alt="Banner"
                layout="responsive"
                width={1000}
                height={300}
                quality={100}
                objectFit="contain"
              />
            </div>
          </div>
          <section className="w-full py-6 md:py-12 lg:py-12 ">
            <h1 className="lg:leading-tighter text-center text-xl font-bold tracking-tighter sm:text-2xl md:text-3xl xl:text-[3rem] 2xl:text-[2.75rem]">
              <TextGenerateEffect words={sub} />
            </h1>
          </section>
          {/* <div className="items-center justify-start text-start mt-12 ">
            <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.6rem] 2xl:text-[4rem] text-red-500">
              <TextGenerateColor words={title} /></h1>
              </div>
      <div className="flex flex-col items-center justify-center text-end mt-12 ">
            <h1 className="lg:leading-tighter text-xl font-bold tracking-tighter sm:text-2xl md:text-3xl xl:text-[3rem] 2xl:text-[2.75rem] mb-4">
              <TextGenerateEffect words={sub} /></h1>
              </div> */}
          <section className="w-full py-12 md:py-24 lg:py-32 border-y">
            <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
              <div className="grid items-center max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-8">
                <div>
                  <h1 className="lg:leading-tighter text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                    Elevate Your Shooting Skills
                  </h1>
                  <p className="mx-auto max-w-p[600] md:text-xl mt-4">
                    With our diverse team of certified instructors, you can
                    learn all about the basics of firearms, all the way up to
                    getting your CCW and more!
                  </p>
                  <div className="mt-6 space-x-4"></div>
                </div>
                <div className="flex justify-center items-center mb-4">
                  <Link href="/public/classes">
                    <Button variant="outline">Class Schedules</Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="grid items-center gap-6 lg:grid-cols-[1fr_500px] lg:gap-2 xl:grid-cols-[1fr_550px]">
                <div className="flex justify-center max-w-full">
                  <Link href="/public/waiver">
                    <Button>Sign The Waiver</Button>
                  </Link>
                </div>
                <div>
                  <div className="inline-block rounded-md bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                    Gun Range Info
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                    Unlock Your Shooting Potential
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400 mt-4">
                    Our gun range offers 20 stalls, all of which are first come
                    first served (we don&apos;t take appointments). There are
                    ZERO time limits with your visits. You can rapid fire, and
                    for CCW holders & Law Enforcement Officers, you can do
                    holster work.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    Join The List Of Champions!
                  </h2>
                  <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Join the thousands of other members that have come to call
                    us their home range.
                  </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                  <form className="flex space-x-2">
                    <Input
                      className="max-w-lg flex-1"
                      placeholder="Enter your email"
                      type="email"
                    />
                    <Button type="submit">Join!</Button>
                  </form>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sign up to get notified of our sales and events.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </TracingBeam>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 SL Inc. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
});

LandingPagePublic.displayName = "LandingPagePublic";

export default LandingPagePublic;
