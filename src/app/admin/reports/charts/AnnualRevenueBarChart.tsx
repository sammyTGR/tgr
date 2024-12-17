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
}

const chartConfig = {
  grossRevenue: {
    label: "Gross Revenue",
    color: "hsl(var(--chart-1))",
  },
  netRevenue: {
    label: "Net Revenue",
    color: "hsl(var(--chart-2))",
  },
};

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function AnnualRevenueBarChart() {
  const queryClient = useQueryClient();

  const { data: activeChart = "grossRevenue" } = useQuery({
    queryKey: ["chartView"],
    queryFn: () => "grossRevenue",
    staleTime: Infinity,
  });

  const setChartViewMutation = useMutation({
    mutationFn: (view: "grossRevenue" | "netRevenue") => Promise.resolve(view),
    onSuccess: (newView) => {
      queryClient.setQueryData(["chartView"], newView);
    },
  });

  const { data: revenueData = [] } = useQuery<RevenueData[]>({
    queryKey: ["revenueData"],
    queryFn: async () => {
      const response = await fetch("/api/revenue");
      if (!response.ok) throw new Error("Failed to fetch revenue data");
      return response.json();
    },
  });

  const total = React.useMemo(() => {
    return revenueData.reduce(
      (acc, item) => ({
        grossRevenue: acc.grossRevenue + item.grossRevenue,
        netRevenue: acc.netRevenue + item.netRevenue,
      }),
      { grossRevenue: 0, netRevenue: 0 }
    );
  }, [revenueData]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Annual Revenue Analysis</CardTitle>
        </div>
        <div className="flex">
          {(["grossRevenue", "netRevenue"] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setChartViewMutation.mutate(key)}
            >
              <span className="text-xs text-muted-foreground">
                {chartConfig[key].label} (YTD)
              </span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                {currencyFormatter.format(total[key])}
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
            data={revenueData}
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
                  return (
                    <div className="rounded-lg border border-border/50 bg-background p-2 shadow-xl">
                      <p className="text-muted-foreground">
                        {
                          chartConfig[activeChart as keyof typeof chartConfig]
                            .label
                        }
                      </p>
                      <p className="font-mono font-medium">
                        {currencyFormatter.format(payload[0].value as number)}
                      </p>
                      <p className="font-medium">{label}</p>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: "transparent" }}
            />
            <Bar
              dataKey={activeChart}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              shape={(props: any) => {
                const { x, y, width, height, index } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={chartColors[index % chartColors.length]}
                    rx={4}
                    ry={4}
                  />
                );
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
