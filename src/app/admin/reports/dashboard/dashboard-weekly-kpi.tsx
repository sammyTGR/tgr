import { TabsContent } from '@/components/ui/tabs';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  isSameMonth,
} from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useQuery } from '@tanstack/react-query';
import { fetchKPIData, KPIResult } from './api';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import React from 'react';
import { BarChart as RechartsBarChart } from '@/components/BarChart';

interface DashboardWeeklyKPIProps {
  dateRange: { from: Date | undefined; to: Date | undefined } | undefined;
  setDateRange: (range: { from: Date | undefined; to: Date | undefined } | undefined) => void;
  getDefaultDateRange: () => { from: Date; to: Date };
  formatter: Intl.NumberFormat;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  data: Record<string, KPIResult>;
  totals: {
    qty: number;
    revenue: number;
  };
}

function DashboardWeeklyKPI({
  dateRange,
  setDateRange,
  getDefaultDateRange,
  formatter,
}: DashboardWeeklyKPIProps) {
  // Get the current month's date range
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  // Use the provided dateRange if available, otherwise use the current month
  const effectiveDateRange =
    dateRange?.from && dateRange?.to
      ? { from: dateRange.from, to: dateRange.to }
      : { from: currentMonthStart, to: currentMonthEnd };

  // Get all weeks in the current month
  const weeksInMonth = eachWeekOfInterval(
    { start: effectiveDateRange.from, end: effectiveDateRange.to },
    { weekStartsOn: 0 } // 0 = Sunday
  );

  // Create a query for each week
  const weekQueries = weeksInMonth.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    const adjustedWeekEnd =
      weekEnd > (effectiveDateRange.to || currentMonthEnd)
        ? effectiveDateRange.to || currentMonthEnd
        : weekEnd;

    return useQuery({
      queryKey: [
        'weekly-kpi',
        format(weekStart, 'yyyy-MM-dd'),
        format(adjustedWeekEnd, 'yyyy-MM-dd'),
      ],
      queryFn: () => fetchKPIData(weekStart, adjustedWeekEnd),
    });
  });

  // Check if any query is loading
  const isLoading = weekQueries.some((query) => query.isLoading);

  // Check if any query has an error
  const error = weekQueries.find((query) => query.error)?.error;

  // Process the data for each week
  const weeklyData = React.useMemo(() => {
    return weekQueries.map((query, index) => {
      const weekStart = weeksInMonth[index];
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const adjustedWeekEnd =
        weekEnd > (effectiveDateRange.to || currentMonthEnd)
          ? effectiveDateRange.to || currentMonthEnd
          : weekEnd;
      const weekKpiData = query.data || {};

      // Calculate week totals
      const weekTotals = {
        qty: 0,
        revenue: 0,
      };

      Object.values(weekKpiData).forEach((data: KPIResult) => {
        weekTotals.qty += data.qty;
        weekTotals.revenue += data.revenue;
      });

      return {
        weekStart,
        weekEnd: adjustedWeekEnd,
        data: weekKpiData,
        totals: weekTotals,
      };
    });
  }, [weekQueries, weeksInMonth, effectiveDateRange.to, currentMonthEnd]);

  // Calculate monthly totals
  const monthlyTotals = React.useMemo(() => {
    return weeklyData.reduce(
      (acc, week) => ({
        qty: acc.qty + week.totals.qty,
        revenue: acc.revenue + week.totals.revenue,
      }),
      { qty: 0, revenue: 0 }
    );
  }, [weeklyData]);

  // Check loading and error states
  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">Error loading weekly KPI data</h2>
        <p className="text-muted-foreground">
          Please try again later or contact support if the issue persists.
        </p>
      </div>
    );
  }

  // Check if we have any data
  if (weeklyData.length === 0) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-2">No Weekly KPI Data Available</h2>
        <p className="text-muted-foreground">There is no data available for the current month.</p>
      </div>
    );
  }

  // Prepare data for charts
  const weeklyChartData = weeklyData.map((week, index) => ({
    dateRange: `${format(week.weekStart, 'MMM d')} - ${format(week.weekEnd, 'MMM d')}`,
    weekQuantity: week.totals.qty,
    weekRevenue: week.totals.revenue,
  }));

  // Prepare data for group comparison chart
  const groupComparisonData = weeklyData.map((week, index) => {
    const result: any = {
      name: `Week ${index + 1}`,
      dateRange: `${format(week.weekStart, 'MMM d')} - ${format(week.weekEnd, 'MMM d')}`,
    };

    // Group the data by group
    const groupedData = groupKPIs(week.data);

    // Add each group's revenue to the result
    Object.entries(groupedData).forEach(([group, data]) => {
      result[group] = data.revenue;
    });

    return result;
  });

  // Get all unique groups across all weeks
  const allGroups = Array.from(
    new Set(weeklyData.flatMap((week) => Object.keys(groupKPIs(week.data))))
  );

  // Define chart configurations
  const quantityRevenueConfig = {
    weekQuantity: {
      label: 'Quantity',
      color: 'hsl(var(--chart-1))',
    },
    weekRevenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-2))',
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
    'Sales',
    'Services',
    'Classes',
    'Range Protection',
    'Range Rentals',
    'Firearms',
  ];

  // Helper function to group KPIs by their group property
  function groupKPIs(kpiData: Record<string, KPIResult>) {
    const grouped: Record<string, { qty: number; revenue: number }> = {};

    Object.values(kpiData).forEach((data) => {
      const group = data.group || 'Other';
      if (!grouped[group]) {
        grouped[group] = { qty: 0, revenue: 0 };
      }
      grouped[group].qty += data.qty;
      grouped[group].revenue += data.revenue;
    });

    return grouped;
  }

  return (
    <TabsContent value="weekly-kpis">
      <div className="space-y-8">
        {/* Monthly Summary */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Monthly Summary ({format(effectiveDateRange.from || new Date(), 'MMMM yyyy')} -{' '}
            {format(effectiveDateRange.to || new Date(), 'MMMM yyyy')})
          </h2>
          <Card className="mb-6 overflow-hidden border-2 border-primary">
            <CardHeader className="bg-primary/10 p-4">
              <CardTitle className="text-xl">Monthly Total</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">{monthlyTotals.qty}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatter.format(monthlyTotals.revenue)}</p>
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
              <CardTitle className="text-lg">Weekly Quantity & Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ChartContainer
                config={quantityRevenueConfig}
                className="min-h-[20px] max-h-[300px] w-full"
              >
                <BarChart
                  data={weeklyChartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="dateRange" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} tickMargin={8} axisLine={false} fontSize={12} />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border/50 bg-background p-2 shadow-xl">
                            <p className="font-medium">{label}</p>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Quantity</p>
                              <p className="font-mono font-medium">{payload[0].value as number}</p>
                              <p className="text-muted-foreground">Revenue</p>
                              <p className="font-mono font-medium">
                                {formatter.format(payload[1].value as number)}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="weekQuantity"
                    name="Quantity"
                    fill={quantityRevenueConfig.weekQuantity.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                  <Bar
                    dataKey="weekRevenue"
                    name="Revenue"
                    fill={quantityRevenueConfig.weekRevenue.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
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
              <ChartContainer config={groupConfig} className="min-h-[20px] max-h-[300px] w-full">
                <BarChart
                  data={groupComparisonData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
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
                                  <p className="text-muted-foreground">{entry.name}</p>
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
                    cursor={{ fill: 'transparent' }}
                  />
                  <ChartLegendContent />
                  {groupOrder.map((group, index) => (
                    <Bar
                      key={group}
                      dataKey={group}
                      name={group}
                      stackId="a"
                      fill={`hsl(var(--chart-${(index % 12) + 1}))`}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
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
                    Week {index + 1}: {format(week.weekStart, 'MMM d')} -{' '}
                    {format(week.weekEnd, 'MMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Week Summary */}
                  <div className="mb-4 p-4 bg-muted/30 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Week Total Quantity</p>
                        <p className="text-xl font-bold">{week.totals.qty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Week Total Revenue</p>
                        <p className="text-xl font-bold">{formatter.format(week.totals.revenue)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Grouped KPIs */}
                  <div className="space-y-4">
                    {Object.entries(groupKPIs(week.data))
                      .sort((a, b) => {
                        const aIndex = groupOrder.indexOf(a[0]);
                        const bIndex = groupOrder.indexOf(b[0]);
                        if (aIndex === -1) return 1;
                        if (bIndex === -1) return -1;
                        return aIndex - bIndex;
                      })
                      .map(([group, data]) => (
                        <div key={group} className="border rounded-md p-3">
                          <h3 className="font-semibold mb-2">{group}</h3>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <p className="text-sm text-muted-foreground">Quantity</p>
                              <p className="font-bold">{data.qty}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Revenue</p>
                              <p className="font-bold">{formatter.format(data.revenue)}</p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Categories:{' '}
                            {Object.keys(week.data)
                              .filter((category) => week.data[category].group === group)
                              .join(', ')}
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
