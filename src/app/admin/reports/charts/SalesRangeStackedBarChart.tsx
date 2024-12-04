"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";

interface ChartData {
  Lanid: string;
  Date: string;
  [key: string]: any;
}

interface SalesRangeStackedBarChartProps {
  selectedRange: { start: Date | undefined; end: Date | undefined };
}

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
  "hsl(var(--chart-13))",
  "hsl(var(--chart-14))",
  "hsl(var(--chart-15))",
  "hsl(var(--chart-16))",
  "hsl(var(--chart-17))",
  "hsl(var(--chart-18))",
  "hsl(var(--chart-19))",
  "hsl(var(--chart-20))",
  "hsl(var(--chart-21))",
  "hsl(var(--chart-22))",
  "hsl(var(--chart-23))",
  "hsl(var(--chart-24))",
];

const processData = (data: any[]) => {
  const processedData: ChartData[] = [];
  const categories: Set<string> = new Set();
  const excludeCategoriesFromChart = [
    "CA Tax Gun Transfer",
    "CA Tax Adjust",
    "CA Excise Tax",
    "CA Excise Tax Adjustment",
  ];
  const excludeCategoriesFromTotalFirearms = [
    "Pistol",
    "Rifle",
    "Revolver",
    "Shotgun",
    "Receiver",
    ...excludeCategoriesFromChart,
  ];

  let totalGross = 0;
  let totalGrossMinusExclusions = 0;
  let totalNet = 0;

  data.forEach((item) => {
    const lanid = item.Lanid;
    const category = item.category_label;
    const grossValue = item.total_gross ?? 0;
    const netValue = item.total_net ?? 0;

    totalGross += grossValue;
    totalNet += netValue;

    if (!excludeCategoriesFromTotalFirearms.includes(category)) {
      totalGrossMinusExclusions += grossValue;
    }

    if (!excludeCategoriesFromChart.includes(category)) {
      let existingEntry = processedData.find((d) => d.Lanid === lanid);
      if (!existingEntry) {
        existingEntry = {
          Lanid: lanid,
          Date: item.Date,
          Total: 0,
          TotalMinusExclusions: 0,
        };
        processedData.push(existingEntry);
      }

      existingEntry[category] = grossValue;
      existingEntry.Total += grossValue;
      if (!excludeCategoriesFromTotalFirearms.includes(category)) {
        existingEntry.TotalMinusExclusions += grossValue;
      }
      categories.add(category);
    }
  });

  return {
    processedData,
    categories: Array.from(categories),
    totalGross,
    totalGrossMinusExclusions,
    totalNet,
  };
};

// Add this function to transform the values
const transformValue = (value: number): number => {
  if (value <= 100) {
    // Apply larger scale for values under 100
    return value * 2;
  } else if (value <= 1000) {
    // Gradual transition
    return 200 + (value - 100) * 0.8;
  } else {
    // Compress higher values
    return 920 + (value - 1000) * 0.3;
  }
};

// Inverse transform for display
const inverseTransform = (value: number): number => {
  if (value <= 200) {
    return value / 2;
  } else if (value <= 920) {
    return 100 + (value - 200) / 0.8;
  } else {
    return 1000 + (value - 920) / 0.3;
  }
};

const SalesRangeStackedBarChart: React.FC<SalesRangeStackedBarChartProps> = ({
  selectedRange,
}) => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["sales-range", selectedRange.start, selectedRange.end],
    queryFn: async () => {
      if (!selectedRange.start || !selectedRange.end) return null;

      const response = await fetch(
        `/api/fetch-sales-data-by-range?start=${
          selectedRange.start.toISOString().split("T")[0]
        }&end=${selectedRange.end.toISOString().split("T")[0]}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      return processData(data);
    },
    enabled: !!selectedRange.start && !!selectedRange.end,
  });

  const chartConfig =
    chartData?.categories.reduce((acc, category, index) => {
      acc[category] = {
        label: category,
        color: chartColors[index % chartColors.length],
      };
      return acc;
    }, {} as ChartConfig) ?? {};

  // Calculate the maximum total height for any stacked bar
  const maxTotal = chartData?.processedData.reduce((max, item) => {
    const total = chartData.categories.reduce((sum, category) => {
      return sum + (item[category] || 0);
    }, 0);
    return Math.max(max, total);
  }, 0);

  // Add some padding (20%) to ensure all stacks are visible
  const yAxisMax = maxTotal ? maxTotal * 1.2 : 0;

  // Calculate custom ticks with non-linear intervals
  const calculateCustomTicks = (max: number): number[] => {
    const ticks: number[] = [];

    // Start with 0
    ticks.push(0);

    // Add very granular intervals for very low values
    if (max > 10) ticks.push(10);
    if (max > 25) ticks.push(25);
    if (max > 30) ticks.push(30);
    if (max > 35) ticks.push(35);
    if (max > 40) ticks.push(40);
    if (max > 45) ticks.push(45);
    if (max > 50) ticks.push(50);
    if (max > 100) ticks.push(100);
    if (max > 250) ticks.push(250);
    if (max > 500) ticks.push(500);
    if (max > 750) ticks.push(750);
    if (max > 1000) ticks.push(1000);

    // Add more intervals between 1000 and 2500
    if (max > 1250) ticks.push(1250);
    if (max > 1500) ticks.push(1500);
    // if (max > 1750) ticks.push(1750);
    if (max > 2000) ticks.push(2000);
    // if (max > 2250) ticks.push(2250);
    if (max > 2500) ticks.push(2500);

    // Add medium intervals with smaller steps
    if (max > 3000) ticks.push(3000);
    if (max > 3500) ticks.push(3500);
    if (max > 4000) ticks.push(4000);
    // if (max > 4500) ticks.push(4500);
    if (max > 5000) ticks.push(5000);
    if (max > 6000) ticks.push(6000);
    if (max > 7000) ticks.push(7000);
    if (max > 8000) ticks.push(8000);
    if (max > 9000) ticks.push(9000);
    if (max > 10000) ticks.push(10000);

    // Add larger intervals
    if (max > 15000) ticks.push(15000);
    if (max > 20000) ticks.push(20000);
    if (max > 25000) ticks.push(25000);

    // Add smaller intervals for remaining values
    const remaining: number = max - ticks[ticks.length - 1];
    const interval: number = remaining / 12;

    for (let i = 1; i <= 12; i++) {
      const value: number = ticks[ticks.length - 1] + interval * i;
      if (value < max) ticks.push(Math.round(value));
    }

    // Add the max value
    ticks.push(Math.ceil(max));

    return ticks;
  };

  const customTicks = maxTotal ? calculateCustomTicks(yAxisMax) : [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!chartData) {
    return <div>No data available</div>;
  }

  return (
    <div style={{ minWidth: chartData.processedData.length * 100 }}>
      <ChartContainer
        config={chartConfig}
        className="min-h-[20px] max-h-[500px] w-full"
      >
        <BarChart
          data={chartData.processedData}
          height={300}
          margin={{ top: 20, right: 30, left: 40, bottom: 50 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="Lanid"
            tickLine={false}
            tickMargin={20}
            axisLine={false}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tickFormatter={(value) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              }).format(inverseTransform(value))
            }
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            domain={[0, () => transformValue(yAxisMax)]}
            ticks={customTicks.map((tick) => transformValue(tick))}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend
            content={<ChartLegendContent />}
            verticalAlign="top"
            align="center"
            height={50}
          />
          {chartData.categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              name={category}
              stackId="a"
              fill={chartColors[index % chartColors.length]}
              radius={
                index === 0
                  ? [4, 4, 0, 0]
                  : index === chartData.categories.length - 1
                  ? [0, 0, 4, 4]
                  : [0, 0, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default SalesRangeStackedBarChart;
