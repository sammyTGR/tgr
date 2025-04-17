import { TabsContent } from "@/components/ui/tabs";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  isSameMonth,
} from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useQuery } from "@tanstack/react-query";
import { fetchKPIData } from "./api";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import React from "react";

// Add KPIResult type import
import { KPIResult } from "./api";

function DashboardWeeklyKPI({
  dateRange,
  setDateRange,
  getDefaultDateRange,
  formatter,
}: any) {
  // Get the date range from January 2025 to current date
  const startDate = new Date(2025, 0, 1); // January 1, 2025
  const endDate = new Date(); // Current date

  // Get all weeks from January 2025 to current date
  const weeksInRange = eachWeekOfInterval(
    { start: startDate, end: endDate },
    { weekStartsOn: 0 } // 0 = Sunday
  );

  // Create a single query for the entire date range
  const {
    data: kpiData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "weekly-kpis",
      format(startDate, "yyyy-MM-dd"),
      format(endDate, "yyyy-MM-dd"),
    ],
    queryFn: () => fetchKPIData(startDate, endDate),
  });

  // Process the data into weekly chunks
  const weeklyData = React.useMemo(() => {
    if (!kpiData) return [];

    return weeksInRange.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const adjustedWeekEnd = weekEnd > endDate ? endDate : weekEnd;

      // Filter data for this week
      const weekData = Object.entries(kpiData).reduce(
        (acc, [category, data]) => {
          // Filter variants based on date
          const filteredVariants = Object.entries(data.variants).reduce(
            (variantAcc, [variant, stats]) => {
              // Here you would need to implement the date filtering logic based on your data structure
              // This is a placeholder - adjust according to your actual data structure
              variantAcc[variant] = stats;
              return variantAcc;
            },
            {} as Record<string, { qty: number; revenue: number }>
          );

          acc[category] = {
            ...data,
            variants: filteredVariants,
          };
          return acc;
        },
        {} as Record<string, KPIResult>
      );

      // Calculate week totals
      const weekTotals = {
        qty: 0,
        revenue: 0,
      };

      Object.values(weekData).forEach((data) => {
        weekTotals.qty += data.qty;
        weekTotals.revenue += data.revenue;
      });

      return {
        weekStart,
        weekEnd: adjustedWeekEnd,
        data: weekData,
        totals: weekTotals,
      };
    });
  }, [kpiData, weeksInRange, endDate]);

  // Calculate monthly totals
  const monthlyTotals = React.useMemo(() => {
    if (!kpiData) return { qty: 0, revenue: 0 };

    return Object.values(kpiData).reduce(
      (acc, data) => ({
        qty: acc.qty + data.qty,
        revenue: acc.revenue + data.revenue,
      }),
      { qty: 0, revenue: 0 }
    );
  }, [kpiData]);

  // Check loading and error states
  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <div>Error loading weekly KPI data</div>;
  }

  // Prepare data for charts
  const weeklyChartData = weeklyData.map((week, index) => ({
    name: `Week ${index + 1}`,
    dateRange: `${format(week.weekStart, "MMM d")} - ${format(week.weekEnd, "MMM d")}`,
    quantity: week.totals.qty,
    revenue: week.totals.revenue,
  }));

  // Prepare data for group comparison chart
  const groupComparisonData = weeklyData.map((week, index) => {
    const result: any = {
      name: `Week ${index + 1}`,
      dateRange: `${format(week.weekStart, "MMM d")} - ${format(week.weekEnd, "MMM d")}`,
    };

    // Add each group's revenue to the result
    Object.entries(week.data).forEach(([group, data]) => {
      result[group] = data.revenue;
    });

    return result;
  });

  // Get all unique groups across all weeks
  const allGroups = Array.from(
    new Set(weeklyData.flatMap((week) => Object.keys(week.data)))
  );

  // Define chart configurations
  const quantityRevenueConfig = {
    quantity: {
      label: "Quantity",
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Create group config dynamically
  const groupConfig = allGroups.reduce((acc, group, index) => {
    acc[group] = {
      label: group,
      color: `hsl(var(--chart-${(index % 12) + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);

  const groupOrder = [
    "Sales",
    "Services",
    "Classes",
    "Range Protection",
    "Range Rentals",
    "Firearms",
  ];

  return (
    <TabsContent value="weekly-kpis">
      <div className="space-y-8">
        {/* Monthly Summary */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Monthly Summary ({format(startDate, "MMMM yyyy")} -{" "}
            {format(endDate, "MMMM yyyy")})
          </h2>
          <Card className="mb-6 overflow-hidden border-2 border-primary">
            <CardHeader className="bg-primary/10 p-4">
              <CardTitle className="text-xl">Monthly Total</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Quantity
                  </p>
                  <p className="text-2xl font-bold">{monthlyTotals.qty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatter.format(monthlyTotals.revenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Comparison Charts */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Weekly Comparisons</h2>

          {/* Quantity and Revenue Chart */}
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="bg-muted/50 p-4">
              <CardTitle className="text-lg">
                Weekly Quantity & Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ChartContainer
                config={quantityRevenueConfig}
                className="h-[300px]"
              >
                <BarChart data={weeklyChartData}>
                  <XAxis dataKey="dateRange" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const quantity = payload.find(
                          (p) => p.name === "quantity"
                        )?.value as number;
                        const revenue = payload.find(
                          (p) => p.name === "revenue"
                        )?.value as number;

                        return (
                          <div className="rounded-lg border border-border/50 bg-background p-2 shadow-xl">
                            <p className="font-medium">{label}</p>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Quantity</p>
                              <p className="font-mono font-medium">
                                {quantity}
                              </p>
                              <p className="text-muted-foreground">Revenue</p>
                              <p className="font-mono font-medium">
                                {formatter.format(revenue)}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <ChartLegendContent />
                  <Bar
                    yAxisId="left"
                    dataKey="quantity"
                    name="quantity"
                    fill="hsl(var(--chart-1))"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="revenue"
                    name="revenue"
                    fill="hsl(var(--chart-2))"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Group Comparison Chart */}
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="bg-muted/50 p-4">
              <CardTitle className="text-lg">Revenue by Group</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ChartContainer config={groupConfig} className="h-[300px]">
                <BarChart data={groupComparisonData}>
                  <XAxis dataKey="dateRange" />
                  <YAxis />
                  <ChartTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border/50 bg-background p-2 shadow-xl">
                            <p className="font-medium">{label}</p>
                            <div className="space-y-1">
                              {payload.map((entry, index) => (
                                <div key={index}>
                                  <p className="text-muted-foreground">
                                    {entry.name}
                                  </p>
                                  <p className="font-mono font-medium">
                                    {formatter.format(entry.value as number)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <ChartLegendContent />
                  {allGroups.map((group) => (
                    <Bar
                      key={group}
                      dataKey={group}
                      name={group}
                      stackId="a"
                      fill={`hsl(var(--chart-${(allGroups.indexOf(group) % 12) + 1}))`}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Details */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Weekly Details</h2>
          <div className="grid grid-cols-1 gap-6">
            {weeklyData.map((week, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-muted/50 p-4">
                  <CardTitle className="text-lg">
                    Week {index + 1}: {format(week.weekStart, "MMM d")} -{" "}
                    {format(week.weekEnd, "MMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Week Summary */}
                  <div className="mb-4 p-4 bg-muted/30 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Week Total Quantity
                        </p>
                        <p className="text-xl font-bold">{week.totals.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Week Total Revenue
                        </p>
                        <p className="text-xl font-bold">
                          {formatter.format(week.totals.revenue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grouped KPIs */}
                  <div className="space-y-4">
                    {Object.entries(week.data).map(([group, data]) => (
                      <div key={group} className="border rounded-md p-3">
                        <h3 className="font-semibold mb-2">{group}</h3>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Quantity
                            </p>
                            <p className="font-bold">{data.qty}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Revenue
                            </p>
                            <p className="font-bold">
                              {formatter.format(data.revenue)}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Categories: {Object.keys(data.variants).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}

export default DashboardWeeklyKPI;
