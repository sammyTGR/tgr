// src/app/admin/audits/HistoricalAuditChart.tsx - fully functional
"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, subDays, parseISO } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChartDataPoint {
  date: string;
  minorMistakes: number;
  majorMistakes: number;
  cancelledDros: number;
}

interface HistoricalChartProps {
  data: any[];
  selectedLanid: string;
}

// Constants
const TIME_ZONE = "America/Los_Angeles";

export function HistoricalAuditChart({
  data,
  selectedLanid,
}: HistoricalChartProps) {
  const queryClient = useQueryClient();

  // Create a separate query for historical time range
  const { data: timeRange } = useQuery({
    queryKey: ["historicalTimeRange"],
    queryFn: () => "7d",
    initialData: "7d",
    staleTime: Infinity, // Prevent automatic refetching
  });

  const handleTimeRangeChange = (value: string) => {
    queryClient.setQueryData(["historicalTimeRange"], value);
  };

  // Transform and aggregate the daily audit data
  const chartData = React.useMemo(() => {
    if (!data?.length || !selectedLanid) return [];

    const employeeData = data.filter(
      (audit) => audit.salesreps === selectedLanid
    );
    if (!employeeData.length) return [];

    const auditsByDate = new Map<string, ChartDataPoint>();

    // Calculate start date based on selected time range only
    const now = toZonedTime(new Date(), TIME_ZONE);
    let startDate: Date;

    switch (timeRange) {
      case "365d":
        startDate = subDays(now, 365);
        break;
      case "90d":
        startDate = subDays(now, 90);
        break;
      case "30d":
        startDate = subDays(now, 30);
        break;
      case "7d":
        startDate = subDays(now, 7);
        break;
      default:
        startDate = subDays(now, 7);
    }

    // Process each audit entry
    employeeData.forEach((audit) => {
      if (!audit.audit_date) return;

      const date = parseISO(audit.audit_date);
      const zonedDate = toZonedTime(date, TIME_ZONE);

      // Skip if before start date
      if (zonedDate < startDate) return;

      const dateKey = formatInTimeZone(zonedDate, TIME_ZONE, "yyyy-MM-dd");

      const currentData = auditsByDate.get(dateKey) || {
        date: dateKey,
        minorMistakes: 0,
        majorMistakes: 0,
        cancelledDros: 0,
      };

      // Check error_location to determine mistake type
      if (audit.error_location) {
        if (
          audit.error_location.includes("Minor") ||
          audit.error_location === "DROS Pending Form"
        ) {
          currentData.minorMistakes += 1;
        } else {
          currentData.majorMistakes += 1;
        }
      }

      // Check for cancelled DROS
      if (audit.dros_cancel === "Yes") {
        currentData.cancelledDros += 1;
      }

      auditsByDate.set(dateKey, currentData);
    });

    return Array.from(auditsByDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data, selectedLanid, timeRange]); // Only depend on these values

  return (
    <Card className="mt-6">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Historical Performance</CardTitle>
          <CardDescription>
            Historical audit metrics for {selectedLanid}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 3 Months</SelectItem>
            <SelectItem value="365d">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="historicalMinor"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient
                  id="historicalMajor"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#EAB308" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EAB308" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient
                  id="historicalCancelled"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const parsedDate = parseISO(date);
                  const zonedDate = toZonedTime(parsedDate, TIME_ZONE);
                  return format(zonedDate, "MMM d");
                }}
                tickMargin={8}
                minTickGap={20}
              />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
                labelFormatter={(label) =>
                  format(new Date(label), "MMMM d, yyyy")
                }
                formatter={(value: number, name: string) => {
                  const formattedName =
                    {
                      minorMistakes: "Minor Mistakes",
                      majorMistakes: "Major Mistakes",
                      cancelledDros: "Cancelled DROS",
                    }[name] || name;
                  return [value, formattedName];
                }}
              />

              <Area
                type="monotone"
                dataKey="minorMistakes"
                name="minorMistakes"
                stroke="#3B82F6"
                fill="url(#historicalMinor)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="majorMistakes"
                name="majorMistakes"
                stroke="#EAB308"
                fill="url(#historicalMajor)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="cancelledDros"
                name="cancelledDros"
                stroke="#EF4444"
                fill="url(#historicalCancelled)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default HistoricalAuditChart;
