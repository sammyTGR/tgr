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
import { Skeleton } from '@/components/ui/skeleton';
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
import { DateRange } from 'react-day-picker';

interface DashboardWeeklyKPIProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange | undefined) => void;
  getDefaultDateRange: () => DateRange;
  formatter: Intl.NumberFormat;
}

function DashboardWeeklyKPI({
  dateRange,
  setDateRange,
  getDefaultDateRange,
  formatter,
}: DashboardWeeklyKPIProps) {
  // Get the effective date range with validation
  const effectiveDateRange = dateRange || getDefaultDateRange();

  // Validate that we have valid dates
  if (!effectiveDateRange.from || !effectiveDateRange.to) {
    return (
      <TabsContent value="weekly-kpis">
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">Invalid date range. Please select a valid date range.</p>
        </div>
      </TabsContent>
    );
  }

  const currentMonthStart = startOfMonth(effectiveDateRange.from);
  const currentMonthEnd = endOfMonth(effectiveDateRange.from);

  // Generate weeks for the current month
  const weeksInMonth = eachWeekOfInterval(
    {
      start: currentMonthStart,
      end: currentMonthEnd,
    },
    { weekStartsOn: 0 }
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
      queryFn: async () => {
        try {
          console.log('Fetching KPI data for week:', {
            start: format(weekStart, 'yyyy-MM-dd'),
            end: format(adjustedWeekEnd, 'yyyy-MM-dd'),
          });
          const result = await fetchKPIData(weekStart, adjustedWeekEnd);
          console.log('KPI data result:', result);
          return result;
        } catch (error) {
          console.error('Error fetching KPI data:', error);
          throw error;
        }
      },
      retry: 1, // Only retry once to avoid infinite loops
      retryDelay: 1000, // Wait 1 second before retrying
    });
  });

  // Check if any query is loading
  const isLoading = weekQueries.some((query) => query.isLoading);

  // Check if any query has an error
  const error = weekQueries.find((query) => query.error)?.error;

  // Process data for charts
  const weeklyData = weekQueries
    .map((query, index) => {
      if (!query.data) return null;

      const weekStart = weeksInMonth[index];
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });

      // Calculate totals from the KPIResult structure
      const totalSales = Object.values(query.data).reduce(
        (sum, category) => sum + (category.revenue || 0),
        0
      );
      const totalTransactions = Object.values(query.data).reduce(
        (sum, category) => sum + (category.qty || 0),
        0
      );
      const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return {
        week: `Week ${index + 1}`,
        startDate: format(weekStart, 'MMM dd'),
        endDate: format(weekEnd, 'MMM dd'),
        totalSales,
        totalTransactions,
        averageTransactionValue,
      };
    })
    .filter((week): week is NonNullable<typeof week> => week !== null);

  if (isLoading) {
    return (
      <TabsContent value="weekly-kpis">
        <Skeleton className="h-96 w-full" />
      </TabsContent>
    );
  }

  if (error) {
    console.error('Weekly KPI Error:', error);
    return (
      <TabsContent value="weekly-kpis">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading weekly KPI data</p>
            <p className="text-sm text-gray-500">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="weekly-kpis">
      <div className="space-y-6">
        {/* Weekly KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatter.format(
                  weeklyData.reduce((sum, week) => sum + (week.totalSales || 0), 0)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklyData.reduce((sum, week) => sum + (week.totalTransactions || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatter.format(
                  weeklyData.length > 0
                    ? weeklyData.reduce((sum, week) => sum + (week.totalSales || 0), 0) /
                        weeklyData.length
                    : 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weeks in Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyData.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatter.format(Number(value))} />
                  <Bar dataKey="totalSales" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalTransactions" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Week</th>
                    <th className="text-left py-2">Period</th>
                    <th className="text-right py-2">Sales</th>
                    <th className="text-right py-2">Transactions</th>
                    <th className="text-right py-2">Avg Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((week, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{week.week}</td>
                      <td className="py-2">
                        {week.startDate} - {week.endDate}
                      </td>
                      <td className="text-right py-2">{formatter.format(week.totalSales || 0)}</td>
                      <td className="text-right py-2">{week.totalTransactions || 0}</td>
                      <td className="text-right py-2">
                        {formatter.format(week.averageTransactionValue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

export default DashboardWeeklyKPI;
