"use client";
import Link from "next/link";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import {
  ActivityLogIcon,
  CalendarIcon,
  ClockIcon,
  CodeIcon,
  LightningBoltIcon,
  StopwatchIcon,
  TextIcon,
} from "@radix-ui/react-icons";

export const AdminReviewAuditsCard = () => (
  <>
    <Link className="group" href="/admin/audits/review">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ActivityLogIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Review Your Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Verify All Submitted Audits By The Team
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const AdminSubmitAuditsCard = () => (
  <>
    <Link className="group" href="/admin/audits/submit">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <TextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Enter Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Time To Pump Up Da Jam... And Audits
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const DrosGuidanceCard = () => (
  <>
    <Link className="group" href="/TGR/dros/guide">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <LightningBoltIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>DROS Guidance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Stay In The Know With DROS Requirements
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const CalendarCard = () => (
  <>
    <Link className="group" href="/TGR/crew/calendar">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Check Your Schedule
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const TimeOffRequestCard = () => (
  <>
    <Link className="group" href="/TGR/crew/timeoffrequest">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ClockIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Request Time Off</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Submit Your Time Off Request
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const AdminTimeOffReviewCard = () => (
  <>
    <Link className="group" href="/admin/timeoffreview">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <StopwatchIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Requests & Missed Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Review Time Off Requests & Enter Missed Time
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const GeneratorCard = () => (
  <>
    <Link className="group" href="/admin/schedule_generator">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <CodeIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Generate Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Review Time Off Requests & Enter Missed Time
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const ChartCard = () => (
  <>
    <Link className="group" href="/charts\AuditsByDayChart">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <CodeIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Generate Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Review Charts With Random Data
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);
