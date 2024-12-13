import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  minorMistakes: number;
  majorMistakes: number;
  cancelledDros: number;
}

const AuditChart = ({ 
  data = [], 
  timeRange, 
  onTimeRangeChange,
  isLoading = false 
}: {
  data: any[];
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  isLoading: boolean;
}) => {
  // Transform and aggregate the daily audit data
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return [];

    const auditsByDate = new Map<string, ChartDataPoint>();

    // Process each audit entry
    data.forEach(audit => {
      if (!audit.audit_date) return;

      const dateKey = format(new Date(audit.audit_date), 'yyyy-MM-dd');
      const currentData = auditsByDate.get(dateKey) || {
        date: dateKey,
        minorMistakes: 0,
        majorMistakes: 0,
        cancelledDros: 0
      };

      // Check error_location to determine mistake type
      if (audit.error_location) {
        // You'll need to adjust these conditions based on your business logic
        if (audit.error_location.includes('Minor') || audit.error_location === 'DROS Pending Form') {
          currentData.minorMistakes += 1;
        } else {
          currentData.majorMistakes += 1;
        }
      }

      // Check for cancelled DROS
      if (audit.dros_cancel === 'Yes') {
        currentData.cancelledDros += 1;
      }

      auditsByDate.set(dateKey, currentData);
    });

    // Convert to array and sort by date
    const result = Array.from(auditsByDate.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Processed chart data:', result);
    return result;
  }, [data]);

  if (isLoading) {
    return <div>Loading chart...</div>;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Daily Audit Metrics</CardTitle>
          <CardDescription>
            Daily breakdown of mistakes and cancelled DROS
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger
            className="w-40 rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
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
                <linearGradient id="minorMistakes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="majorMistakes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EAB308" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EAB308" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="cancelledDros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                tickMargin={8}
                minTickGap={20}
              />
              <YAxis />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'var(--background)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border)' 
                }}
                labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                formatter={(value: number, name: string) => {
                  const formattedName = {
                    minorMistakes: 'Minor Mistakes',
                    majorMistakes: 'Major Mistakes',
                    cancelledDros: 'Cancelled DROS'
                  }[name] || name;
                  return [value, formattedName];
                }}
              />
              
              <Area
                type="monotone"
                dataKey="minorMistakes"
                name="minorMistakes"
                stroke="#3B82F6"
                fill="url(#minorMistakes)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="majorMistakes"
                name="majorMistakes"
                stroke="#EAB308"
                fill="url(#majorMistakes)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="cancelledDros"
                name="cancelledDros"
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

export default AuditChart;