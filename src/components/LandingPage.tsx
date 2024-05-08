
import Link from "next/link"
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card"
import { JSX, SVGProps } from "react"
import { TextGenerateEffect } from "./ui/text-generate-effect"
import { ActivityLogIcon, LightningBoltIcon } from "@radix-ui/react-icons"

const words = 'Let\'s Get Started'
const subwords = 'Welcome To The New TGR Admin Dashboard'
export default function LandingPage() {
  return (
    <>
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl"><TextGenerateEffect words={words} /></h1>
            <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
            <TextGenerateEffect words={subwords} />
            </p>
            {/* <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
              href="#"
            >
              Get Started
            </Link> */}
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
                  <p className="text-gray-500 dark:text-gray-400">Verify All Submitted Audits By The Team</p>
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
            <Link className="group" href="/audits/supaaudits">
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <TextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <CardTitle>Enter Audits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">Utilize The Helper Floating Menu Bar During Your Audits</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function ActivityIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  )
}


function CalendarIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}


function TextIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 6.1H3" />
      <path d="M21 12.1H3" />
      <path d="M15.1 18H3" />
    </svg>
  )
}
