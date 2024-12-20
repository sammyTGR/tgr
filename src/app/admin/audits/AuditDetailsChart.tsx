"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface ChartDataPoint {
  date: string;
  location: number;
  details: number;
  cancelledDros: number;
  error_locations: string[];
  error_details: string[];
}

interface AuditDetailsChartProps {
  data: any[];
  isLoading?: boolean;
  selectedDate?: Date | null;
}

const AuditDetailsChart: React.FC<AuditDetailsChartProps> = ({
  data = [],
  isLoading = false,
  selectedDate = null,
}) => {
  const chartData = React.useMemo(() => {
    if (!data || !data.length || !selectedDate) return [];

    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);
    
    const filteredData = data.filter(audit => {
      const transDate = new Date(audit.trans_date);
      return transDate >= startDate && transDate <= endDate;
    });

    const auditsByDate = new Map<string, ChartDataPoint>();

    // Process each audit entry
    filteredData.forEach((audit) => {
      if (!audit.trans_date) return;

      const dateKey = format(new Date(audit.trans_date), "yyyy-MM-dd");
      const existingData = auditsByDate.get(dateKey) || {
        date: dateKey,
        location: 0,
        details: 0,
        cancelledDros: 0,
        error_locations: [],
        error_details: []
      };

      // Increment counters and store error details
      if (audit.error_location) {
        existingData.location += 1;
        existingData.error_locations.push(audit.error_location);
      }
      if (audit.error_details) {
        existingData.details += 1;
        existingData.error_details.push(audit.error_details);
      }
      if (audit.dros_cancel === "Yes") {
        existingData.cancelledDros += 1;
      }

      auditsByDate.set(dateKey, existingData);
    });

    return Array.from(auditsByDate.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data, selectedDate]);

  if (isLoading) {
    return <div>Loading chart...</div>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Audit Details by Transaction Date</CardTitle>
        <CardDescription>
          Distribution of audits by Location, Details, and Cancelled DROS
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="location" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="details" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EAB308" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EAB308" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="cancelledDros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM d")}
                tickMargin={8}
                minTickGap={20}
              />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  padding: "12px",
                  maxWidth: "400px",
                  whiteSpace: "normal"
                }}
                labelFormatter={(label) => format(new Date(label), "MMMM d, yyyy")}
                itemSorter={() => -1}
                formatter={(value: number, name: string, props: any) => {
                  const item = props.payload;
                  switch (name) {
                    case "Location":
                      return [
                        <div key="location" className="space-y-1">
                          <div className="font-semibold">{`${value} Location Errors:`}</div>
                          {item.error_locations.map((loc: string, index: number) => (
                            <div key={index} className="pl-2 border-l-2 border-blue-500">
                              {loc}
                            </div>
                          ))}
                        </div>,
                        ""
                      ];
                    case "Details":
                      return [
                        <div key="details" className="space-y-1">
                          <div className="font-semibold">{`${value} Detail Errors:`}</div>
                          {item.error_details.map((detail: string, index: number) => (
                            <div key={index} className="pl-2 border-l-2 border-yellow-500">
                              {detail}
                            </div>
                          ))}
                        </div>,
                        ""
                      ];
                    case "Cancelled DROS":
                      return [`${value} Cancelled DROS`, ""];
                    default:
                      return [value, ""];
                  }
                }}
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Legend />

              <Area
                type="monotone"
                dataKey="location"
                name="Location"
                stroke="#3B82F6"
                fill="url(#location)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="details"
                name="Details"
                stroke="#EAB308"
                fill="url(#details)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="cancelledDros"
                name="Cancelled DROS"
                stroke="#EF4444"
                fill="url(#cancelledDros)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditDetailsChart;