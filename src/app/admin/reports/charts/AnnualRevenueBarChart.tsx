"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface RevenueData {
  month: string;
  grossRevenue: number;
  netRevenue: number;
  historicalGrossRevenue?: number;
  historicalNetRevenue?: number;
  futureGrossRevenue?: number;
  futureNetRevenue?: number;
}

const chartConfig = {
  grossRevenue: {
    label: "Gross Revenue",
    color: "hsl(var(--chart-1))",
    historicalColor: "hsl(var(--chart-3))",
    futureColor: "hsl(var(--chart-7))",
  },
  netRevenue: {
    label: "Net Revenue",
    color: "hsl(var(--chart-2))",
    historicalColor: "hsl(var(--chart-4))",
    futureColor: "hsl(var(--chart-8))",
  },
};

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
  "hsl(var(--chart-9))",
  "hsl(var(--chart-10))",
  "hsl(var(--chart-11))",
  "hsl(var(--chart-12))",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function AnnualRevenueBarChart() {
  const queryClient = useQueryClient();

  const { data: activeChart = "netRevenue" } = useQuery({
    queryKey: ["chartView"],
    queryFn: () => "netRevenue",
    staleTime: Infinity,
  });

  const setChartViewMutation = useMutation({
    mutationFn: (view: "grossRevenue" | "netRevenue") => Promise.resolve(view),
    onSuccess: (newView) => {
      queryClient.setQueryData(["chartView"], newView);
    },
  });

  const { data: currentRevenueData = [] } = useQuery<RevenueData[]>({
    queryKey: ["revenueData"],
    queryFn: async () => {
      const response = await fetch("/api/revenue");
      if (!response.ok) throw new Error("Failed to fetch revenue data");
      return response.json();
    },
  });

  const { data: historicalRevenueData = [] } = useQuery<RevenueData[]>({
    queryKey: ["historicalRevenueData"],
    queryFn: async () => {
      const response = await fetch("/api/historical-revenue");
      if (!response.ok)
        throw new Error("Failed to fetch historical revenue data");
      return response.json();
    },
  });

  const { data: futureRevenueData = [] } = useQuery<RevenueData[]>({
    queryKey: ["futureRevenueData"],
    queryFn: async () => {
      const response = await fetch("/api/future-revenue");
      if (!response.ok) throw new Error("Failed to fetch future revenue data");
      return response.json();
    },
  });

  const combinedData = React.useMemo(() => {
    return currentRevenueData.map((current) => {
      const historical = historicalRevenueData.find(
        (h) => h.month.split(" ")[0] === current.month.split(" ")[0]
      );
      const future = futureRevenueData.find(
        (f) => f.month.split(" ")[0] === current.month.split(" ")[0]
      );
      return {
        ...current,
        historicalGrossRevenue: historical?.grossRevenue || 0,
        historicalNetRevenue: historical?.netRevenue || 0,
        futureGrossRevenue: future?.grossRevenue || 0,
        futureNetRevenue: future?.netRevenue || 0,
      };
    });
  }, [currentRevenueData, historicalRevenueData, futureRevenueData]);

  const totals = React.useMemo(() => {
    const historical = historicalRevenueData.reduce(
      (acc, item) => ({
        grossRevenue: acc.grossRevenue + item.grossRevenue,
        netRevenue: acc.netRevenue + item.netRevenue,
      }),
      { grossRevenue: 0, netRevenue: 0 }
    );

    const current = currentRevenueData.reduce(
      (acc, item) => ({
        grossRevenue: acc.grossRevenue + item.grossRevenue,
        netRevenue: acc.netRevenue + item.netRevenue,
      }),
      { grossRevenue: 0, netRevenue: 0 }
    );

    const future = futureRevenueData.reduce(
      (acc, item) => ({
        grossRevenue: acc.grossRevenue + (item.grossRevenue || 0),
        netRevenue: acc.netRevenue + (item.netRevenue || 0),
      }),
      { grossRevenue: 0, netRevenue: 0 }
    );

    return { historical, current, future };
  }, [historicalRevenueData, currentRevenueData, futureRevenueData]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Annual Revenue Analysis</CardTitle>
        </div>
        <div className="flex">
          {(["netRevenue", "grossRevenue"] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-center even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setChartViewMutation.mutate(key)}
            >
              <span className="text-sm font-medium">
                {chartConfig[key].label}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ChartContainer
          config={chartConfig}
          className="min-h-[200px] max-h-[500px] w-full"
        >
          <BarChart
            data={combinedData}
            margin={{ top: 10, right: 10, left: 40, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={30}
              axisLine={false}
              fontSize={12}
              angle={0}
              textAnchor="middle"
              interval={0}
              height={40}
              tickFormatter={(value) => value.split(" ")[0]}
            />
            <YAxis
              tickFormatter={(value) => currencyFormatter.format(value)}
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              fontSize={12}
              width={60}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const historicalValue = payload[0].value as number;
                  const currentValue = payload[1].value as number;
                  const futureValue = payload[2].value as number;

                  // Calculate percentage differences
                  const yearOverYearDiff =
                    historicalValue !== 0
                      ? ((currentValue - historicalValue) / historicalValue) *
                        100
                      : 0;

                  const futureYearDiff =
                    currentValue !== 0
                      ? ((futureValue - currentValue) / currentValue) * 100
                      : 0;

                  return (
                    <div className="rounded-lg border border-border/50 bg-background p-2 shadow-xl">
                      <p className="font-medium">{label}</p>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">
                          2023{" "}
                          {
                            chartConfig[activeChart as keyof typeof chartConfig]
                              .label
                          }
                        </p>
                        <p className="font-mono font-medium">
                          {currencyFormatter.format(historicalValue)}
                        </p>
                        <p className="text-muted-foreground">
                          2024{" "}
                          {
                            chartConfig[activeChart as keyof typeof chartConfig]
                              .label
                          }
                        </p>
                        <p className="font-mono font-medium">
                          {currencyFormatter.format(currentValue)}
                        </p>
                        <p className="text-muted-foreground">
                          2025{" "}
                          {
                            chartConfig[activeChart as keyof typeof chartConfig]
                              .label
                          }
                        </p>
                        <p className="font-mono font-medium">
                          {currencyFormatter.format(futureValue)}
                        </p>
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p
                            className={`font-medium ${
                              yearOverYearDiff > 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            2023 to 2024: {yearOverYearDiff > 0 ? "+" : ""}
                            {yearOverYearDiff.toFixed(2)}%
                          </p>
                          <p
                            className={`font-medium ${
                              futureYearDiff > 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            2024 to 2025: {futureYearDiff > 0 ? "+" : ""}
                            {futureYearDiff.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey={`historical${
                activeChart.charAt(0).toUpperCase() + activeChart.slice(1)
              }`}
              name="2023"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              fill={
                chartConfig[activeChart as keyof typeof chartConfig]
                  .historicalColor
              }
            />
            <Bar
              dataKey={activeChart}
              name="2024"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              fill={chartConfig[activeChart as keyof typeof chartConfig].color}
            />
            <Bar
              dataKey={`future${
                activeChart.charAt(0).toUpperCase() + activeChart.slice(1)
              }`}
              name="2025"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              fill={
                chartConfig[activeChart as keyof typeof chartConfig].futureColor
              }
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
