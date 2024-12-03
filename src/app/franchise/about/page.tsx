'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

interface RevenueData {
  month: string;
  revenue: number;
}

interface MetricData {
  metric: string;
  value: string;
}

const chartConfig = {
  revenue: {
    label: "Net Revenue",
    color: "hsl(var(--chart-1))"
  }
} satisfies ChartConfig

const columnHelper = createColumnHelper<MetricData>();

const columns = [
  columnHelper.accessor('metric', {
    header: 'Metric',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('value', {
    header: 'Value',
    cell: info => info.getValue(),
  })
];

const metricsData = [
  { metric: 'Average Monthly Revenue', value: '$103,333' },
  { metric: 'Customer Retention Rate', value: '87%' },
  { metric: 'Class Attendance Rate', value: '92%' },
  { metric: 'Staff Satisfaction Score', value: '4.8/5' },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const FranchisePresentation = () => {
  const { data: revenueData, isLoading, error } = useQuery<RevenueData[]>({
    queryKey: ['revenue'],
    queryFn: async () => {
      const response = await fetch('/api/revenue');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const table = useReactTable({
    data: metricsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">The Gun Range Operations</CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
        <Card>
      <CardHeader>
        <CardTitle>Monthly Net Revenue</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ChartContainer config={chartConfig}>
          <BarChart data={revenueData}>
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis 
              tickFormatter={(value) => currencyFormatter.format(value)}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="revenue" 
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <FeatureCard 
              title="Daily Operations" 
              features={['Scheduling', 'Time Tracking', 'Point Of Sale Integration', 'Customer Management', 'Special Order Requests & Tracking', 'Daily Deposits & Reporting', 'Daily Range Status Updates & Repairs', 'Daily Rental Firearm Checks', 'Internal Gunsmithing Requests & Updates']}
            />
            <FeatureCard 
              title="Staff Management" 
              features={['Role-Based Access', 'Time Tracking', 'Performance Metrics', 'Staff Reviews', 'Certification Tracking', 'Time Off Requests', 'Create & Manage Schedules']}
            />
            <FeatureCard 
              title="Compliance & Safety" 
              features={['Digital Waivers', 'Internal Audits', 'Audit Reports & Reviews', 'DROS & 4473 Sales Support', 'Internal Standards & Procedures']}
            />
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <div className="grid grid-cols-2 gap-4">
            <OperationsCard 
              title="Class Management" 
              features={['Online booking system', 'Automated reminders', 'Capacity management', 'Instructor scheduling']}
            />
            <OperationsCard 
              title="Range Management" 
              features={['Lane availability tracking', 'Equipment maintenance', 'Safety protocols', 'Digital range rules']}
            />
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-2 gap-4">
            <MetricsCard 
              title="Financial Metrics" 
              metrics={['Real-time revenue tracking', 'Expense management', 'Profit analysis', 'Inventory costs']}
            />
            <MetricsCard 
              title="Operational Metrics" 
              metrics={['Lane utilization rates', 'Class attendance', 'Customer satisfaction', 'Safety compliance']}
            />
          </div>
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