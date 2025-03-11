"use client";

import SalesRangeStackedBarChart from "@/app/admin/reports/charts/SalesRangeStackedBarChart";
import LoadingIndicator from "@/components/LoadingIndicator";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomCalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/context/RoleContext";
import { supabase } from "@/utils/supabase/client";
import {
  BarChartIcon,
  BellIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClipboardIcon,
  CrossCircledIcon,
  DrawingPinIcon,
  FilePlusIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  TableIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import { endOfDay, format, subDays, parseISO, startOfDay } from "date-fns";
import { format as formatTZ, toZonedTime } from "date-fns-tz";
import DOMPurify from "isomorphic-dompurify";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import TodoWrapper from "../../../todo/todo-wrapper";
import styles from "../table.module.css";
import AnnualRevenueBarChart from "@/app/admin/reports/charts/AnnualRevenueBarChart";
import {
  fetchDomains,
  fetchSuggestions,
  fetchCertificates,
  replySuggestion,
  addDomainMutation,
  updateDomainMutation,
  deleteDomainMutation,
  fetchLatestRangeWalkReport,
  fetchLatestChecklistSubmission,
  fetchLatestGunsmithMaintenance,
  fetchLatestDailyDeposit,
  fetchDailyChecklistStatus,
  fetchLatestSalesData,
} from "../api";
import { sendEmail } from "../actions";
import SalesDataTableAllEmployees from "@/app/admin/reports/sales/sales-data-table-all-employees";
import { SalesAtGlanceTable } from "../../sales/sales-at-glance-table";
import {
  CommandEmpty,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Command } from "@/components/ui/command";
import { CommandGroup } from "@/components/ui/command";
import { CommandList } from "@/components/ui/command";
import AdminDashboardContent from "../page";

export default function CeoDashboard() {
  return (
    <RoleBasedWrapper allowedRoles={["ceo", "super admin", "dev"]}>
      <div className="container max-w-[calc(100vw-90px)] py-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">CEO Dashboard</CardTitle>
          </CardHeader>
        </Card>
        <AdminDashboardContent />
      </div>
    </RoleBasedWrapper>
  );
}
