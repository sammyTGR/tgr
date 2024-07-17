"use client";
import Link from "next/link";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import {
  ActivityLogIcon,
  ArchiveIcon,
  CalendarIcon,
  ClockIcon,
  CodeIcon,
  CookieIcon,
  EyeOpenIcon,
  FileTextIcon,
  InputIcon,
  LightningBoltIcon,
  ReaderIcon,
  StopwatchIcon,
  TextIcon,
} from "@radix-ui/react-icons";
import { DollarSignIcon } from "lucide-react";

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

export const WaiverCard = () => (
  <>
    <Link className="group" href="/public/waiver">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ReaderIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Waiver Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Everyone Is Required To Fill This Out Before Shooting.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const OrderCard = () => (
  <>
    <Link className="group" href="/sales/orders">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <InputIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Submit Customer Request</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Submit Order Requests, Add To Waitlist, Contact Gunsmithing, etc.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const DepositsCard = () => (
  <>
    <Link className="group" href="/TGR/deposits">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <DollarSignIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Submit Daily Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Submit Daily Deposits.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const WaiverReviewCard = () => (
  <>
    <Link className="group" href="/sales/waiver/checkin">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ArchiveIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Check Customers In</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Check Customers In & Verify If They Completed Waivers.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const AdminWaiverReviewCard = () => (
  <>
    <Link className="group" href="/sales/waiver/checkin">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ArchiveIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Review Waivers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Verify If Customers Completed Waivers & Check Them In.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const RangeWalkCard = () => (
  <>
    <Link className="group" href="/TGR/rangewalk">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <EyeOpenIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Submit Range Walk</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Submit Daily Range Walk Reports.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const RangeRepairCard = () => (
  <>
    <Link className="group" href="/TGR/rangerepairs">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <EyeOpenIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Submit Range Repair</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Submit Range Repair Reports.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const SOPCard = () => (
  <>
    <Link className="group" href="/TGR/sop">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <FileTextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>TGR SOPs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Study This During Down Time To Understand Processes.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const AdminSOPCard = () => (
  <>
    <Link className="group" href="/admin/sop">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <FileTextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>SOPs For Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            SOPs For Back Of The House SOPs.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const PointsCard = () => (
  <>
    <Link className="group" href="/TGR/crew/points">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <FileTextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Submit Your Points</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Report All Of Your Submitted Points.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const CrewOrdersCard = () => (
  <>
    <Link className="group" href="/sales/orderreview/crew">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ReaderIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Check On Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Check On Orders Submitted By The Crew.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);

export const GunsmithingCard = () => (
  <>
    <Link className="group" href="/TGR/gunsmithing">
      <Card>
        <CardHeader className="flex items-center gap-2">
          <CookieIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <CardTitle>Gunsmithing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Weekly Firearms Maintenance.
          </p>
        </CardContent>
      </Card>
    </Link>
  </>
);
