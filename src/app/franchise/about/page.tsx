'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface RevenueData {
  month: string;
  grossRevenue: number;
  netRevenue: number;
}

interface MetricData {
  metric: string;
  value: string;
}

interface SalesMetrics {
  averageMonthlyGrossRevenue: number;
  averageMonthlyNetRevenue: number;
  topPerformingCategories: { category: string; revenue: number }[];
  peakHours: { hour: number; transactions: number; formattedHour: string }[];
  customerFrequency: { visits: string; percentage: number }[];
}

const chartConfig = {
  grossRevenue: {
    label: 'Gross Revenue',
    color: 'hsl(var(--chart-1))',
  },
  netRevenue: {
    label: 'Net Revenue',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

const columnHelper = createColumnHelper<MetricData>();

const columns = [
  columnHelper.accessor('metric', {
    header: 'Metric',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('value', {
    header: 'Value',
    cell: (info) => info.getValue(),
  }),
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
  'hsl(var(--chart-9))',
  'hsl(var(--chart-10))',
  'hsl(var(--chart-11))',
  'hsl(var(--chart-12))',
];

const FranchisePresentation = () => {
  const queryClient = useQueryClient();

  const { data: activeChart } = useQuery({
    queryKey: ['revenue-chart-view'],
    queryFn: () => 'netRevenue' as 'grossRevenue' | 'netRevenue',
    initialData: 'netRevenue',
  });

  const setChartViewMutation = useMutation({
    mutationFn: async (newView: 'grossRevenue' | 'netRevenue') => newView,
    onMutate: async (newView) => {
      await queryClient.cancelQueries({ queryKey: ['revenue-chart-view'] });
      const previousView = queryClient.getQueryData(['revenue-chart-view']);
      queryClient.setQueryData(['revenue-chart-view'], newView);
      return { previousView };
    },
    onError: (err, newView, context) => {
      if (context?.previousView) {
        queryClient.setQueryData(['revenue-chart-view'], context.previousView);
      }
    },
  });

  const {
    data: revenueData,
    isLoading,
    error,
  } = useQuery<RevenueData[]>({
    queryKey: ['revenue'],
    queryFn: async () => {
      const response = await fetch('/api/revenue');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    },
    refetchInterval: 43200000, // Refetch every 12 hours
  });

  const { data: metrics, isLoading: isMetricsLoading } = useQuery<SalesMetrics>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    },
  });

  const metricsData = React.useMemo(() => {
    if (!metrics) return [];

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    return [
      {
        metric: 'Average Monthly Gross Revenue',
        value: formatter.format(metrics.averageMonthlyGrossRevenue),
      },
      {
        metric: 'Average Monthly Net Revenue',
        value: formatter.format(metrics.averageMonthlyNetRevenue),
      },
      {
        metric: 'Top Performing Category',
        value: metrics.topPerformingCategories[0]?.category || 'N/A',
      },
      {
        metric: 'Peak Business Hour',
        value: metrics.peakHours[0]
          ? `${metrics.peakHours[0].formattedHour} (${metrics.peakHours[0].transactions} transactions)`
          : 'N/A',
      },
    ];
  }, [metrics]);

  const table = useReactTable({
    data: metricsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const total = React.useMemo(
    () => ({
      grossRevenue: revenueData?.reduce((acc, curr) => acc + curr.grossRevenue, 0) || 0,
      netRevenue: revenueData?.reduce((acc, curr) => acc + curr.netRevenue, 0) || 0,
    }),
    [revenueData]
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">The Gun Range Operations</CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <div className="flex items-center space-x-2">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="overview">TGR Web App Overview</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid grid-cols-3 gap-4">
            <FeatureCard
              title="Oversee Operations Management On TGR"
              features={[
                'Scheduling',
                'Time Tracking',
                'Point Of Sale Integration',
                'Customer Management',
                'Special Order Requests & Tracking',
                'Daily Deposits & Reporting',
                'Daily Range Status Updates & Repairs',
                'Daily Rental Firearm Checks',
                'Internal Gunsmithing Requests & Updates',
              ]}
            />
            <FeatureCard
              title="Staff Management"
              features={[
                'Role-Based Access',
                'Time Tracking',
                'Performance Metrics',
                'Staff Reviews',
                'Certification Tracking',
                'Time Off Requests',
                'Create & Manage Schedules',
              ]}
            />
            <FeatureCard
              title="Compliance & Safety"
              features={[
                'Digital Waivers',
                'Internal Audits',
                'Audit Reports & Reviews',
                'DROS & 4473 Sales Support',
                'Internal Standards & Procedures',
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                  <CardTitle>Revenue Analysis</CardTitle>
                </div>
                <div className="flex">
                  {(['grossRevenue', 'netRevenue'] as const).map((key) => (
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
                <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
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
                      angle={-45}
                      textAnchor="end"
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
                                {chartConfig[activeChart as keyof typeof chartConfig].label}
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
                      cursor={{ fill: 'transparent' }}
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

            <div className="grid grid-cols-2 gap-4">
              <MetricsCard
                title="Financial Metrics"
                metrics={[
                  'Real-time revenue tracking',
                  'Expense management',
                  'Profit analysis',
                  'Inventory costs',
                ]}
              />
              <MetricsCard
                title="Operational Metrics"
                metrics={[
                  'Lane utilization rates',
                  'Class attendance',
                  'Customer satisfaction',
                  'Safety compliance',
                ]}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <div className="grid grid-cols-2 gap-4">
            <OperationsCard
              title="Class Management"
              features={[
                'Online booking system',
                'Automated reminders',
                'Capacity management',
                'Instructor scheduling',
              ]}
            />
            <OperationsCard
              title="Range Management"
              features={[
                'Lane availability tracking',
                'Equipment maintenance',
                'Safety protocols',
                'Digital range rules',
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {isMetricsLoading ? (
                <div className="flex items-center justify-center p-4">Loading metrics...</div>
              ) : (
                <>
                  <div className="rounded-md border mb-6">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <th
                                key={header.id}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {table.getRowModel().rows.map((row) => (
                          <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Visit Frequency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        {metrics?.customerFrequency.map((freq) => (
                          <Card key={freq.visits} className="bg-muted/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium">{freq.visits}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{freq.percentage}%</div>
                              <p className="text-sm text-muted-foreground mt-1">
                                of total customers
                              </p>
                              <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${freq.percentage}%` }}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const FeatureCard = ({ title, features }: { title: string; features: string[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index}>✓ {feature}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const OperationsCard = ({ title, features }: { title: string; features: string[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index}>• {feature}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const MetricsCard = ({ title, metrics }: { title: string; metrics: string[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2">
        {metrics.map((metric, index) => (
          <li key={index}>• {metric}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default FranchisePresentation;
