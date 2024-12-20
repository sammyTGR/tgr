"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TooltipProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart";

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

const chartConfig = {
  location: {
    label: "Location",
    color: "hsl(217, 91%, 60%)", // blue-500
  },
  details: {
    label: "Details",
    color: "hsl(43, 96%, 47%)", // yellow-500
  },
  cancelledDros: {
    label: "Cancelled DROS",
    color: "hsl(0, 84%, 60%)", // red-500
  },
} satisfies ChartConfig;

const AuditDetailsChart: React.FC<AuditDetailsChartProps> = ({
  data = [],
  isLoading = false,
  selectedDate = null,
}) => {
  const chartData = React.useMemo(() => {
    if (!data || !data.length || !selectedDate) return [];

    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);

    const filteredData = data.filter((audit) => {
      const transDate = new Date(audit.trans_date);
      return transDate >= startDate && transDate <= endDate;
    });

    const auditsByDate = new Map<string, ChartDataPoint>();

    filteredData.forEach((audit) => {
      if (!audit.trans_date) return;

      const dateKey = format(new Date(audit.trans_date), "yyyy-MM-dd");
      const existingData = auditsByDate.get(dateKey) || {
        date: dateKey,
        location: 0,
        details: 0,
        cancelledDros: 0,
        error_locations: [],
        error_details: [],
      };

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
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[400px] w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM d")}
                tickMargin={8}
                minTickGap={20}
                tickLine={false}
                axisLine={false}
              />
              <YAxis />
              <ChartTooltip
                content={({
                  active,
                  payload,
                  label,
                }: TooltipProps<ValueType, NameType>) => {
                  if (!active || !payload) return null;
                  const item = payload[0]?.payload as ChartDataPoint;
                  if (!item) return null;

                  return (
                    <div className="space-y-2 rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-semibold">
                        {format(new Date(item.date), "MMMM d, yyyy")}
                      </div>
                      {item.location > 0 && (
                        <div className="space-y-1">
                          <div className="font-semibold">{`${item.location} Location Errors:`}</div>
                          {item.error_locations.map(
                            (loc: string, index: number) => (
                              <div
                                key={index}
                                className="pl-2 border-l-2 border-blue-500"
                              >
                                {loc}
                              </div>
                            )
                          )}
                        </div>
                      )}
                      {item.details > 0 && (
                        <div className="space-y-1">
                          <div className="font-semibold">{`${item.details} Detail Errors:`}</div>
                          {item.error_details.map(
                            (detail: string, index: number) => (
                              <div
                                key={index}
                                className="pl-2 border-l-2 border-yellow-500"
                              >
                                {detail}
                              </div>
                            )
                          )}
                        </div>
                      )}
                      {item.cancelledDros > 0 && (
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {`${item.cancelledDros} Cancelled DROS`}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="location"
                stackId="a"
                fill="var(--color-location)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="details"
                stackId="a"
                fill="var(--color-details)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="cancelledDros"
                stackId="a"
                fill="var(--color-cancelledDros)"
                radius={[0, 0, 4, 4]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditDetailsChart;
