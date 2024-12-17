"use client";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface ChartData {
  Lanid: string;
  Date: string;
  [key: string]: any;
}

interface SalesRangeStackedBarChartProps {
  selectedRange: { start: Date | undefined; end: Date | undefined };
}

interface ProcessedData {
  processedData: ChartData[];
  categories: string[];
  totalGross: number;
  totalNet: number;
  totalNetMinusExclusions: number;
}

type ChartView =
  | "totalGross"
  | "totalNetWithFirearms"
  | "totalNetWithoutFirearms";

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

const transformValue = (value: number): number => {
  if (value <= 100) {
    return value * 2;
  } else if (value <= 1000) {
    return 200 + (value - 100) * 0.8;
  } else {
    return 920 + (value - 1000) * 0.3;
  }
};

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
  const queryClient = useQueryClient();

  const { data: activeView } = useQuery({
    queryKey: ["chart-view"],
    queryFn: () => "totalGross" as ChartView,
    initialData: "totalGross",
  });

  const setViewMutation = useMutation({
    mutationFn: async (newView: ChartView) => newView,
    onMutate: async (newView) => {
      await queryClient.cancelQueries({ queryKey: ["chart-view"] });
      const previousView = queryClient.getQueryData(["chart-view"]);
      queryClient.setQueryData(["chart-view"], newView);
      return { previousView };
    },
    onError: (err, newView, context) => {
      if (context?.previousView) {
        queryClient.setQueryData(["chart-view"], context.previousView);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-range-data"] });
    },
  });

  const { data: salesData, isLoading } = useQuery({
    queryKey: [
      "sales-range-data",
      selectedRange.start,
      selectedRange.end,
      activeView,
    ],
    queryFn: async () => {
      if (!selectedRange.start || !selectedRange.end) {
        throw new Error("Date range not selected");
      }

      const response = await fetch(
        `/api/fetch-sales-data-by-range?start=${
          selectedRange.start.toISOString().split("T")[0]
        }&end=${selectedRange.end.toISOString().split("T")[0]}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      return response.json();
    },
    enabled: !!selectedRange.start && !!selectedRange.end,
  });

  const processData = (data: any[], currentView: ChartView): ProcessedData => {
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
    let totalNet = 0;
    let totalNetMinusExclusions = 0;

    data.forEach((item) => {
      const lanid = item.Lanid;
      const category = item.category_label;
      const grossValue = item.total_gross ?? 0;
      const netValue = item.total_net ?? 0;

      totalGross += grossValue;

      if (!excludeCategoriesFromChart.includes(category)) {
        totalNet += netValue;
      }

      if (!excludeCategoriesFromTotalFirearms.includes(category)) {
        totalNetMinusExclusions += netValue;
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

        existingEntry[category] = netValue;
        existingEntry.Total += netValue;
        if (!excludeCategoriesFromTotalFirearms.includes(category)) {
          existingEntry.TotalMinusExclusions += netValue;
        }
        categories.add(category);
      }
    });

    const processedDataForView = processedData.map((item) => {
      const displayItem = { ...item };

      Object.keys(displayItem).forEach((key) => {
        if (
          typeof displayItem[key] === "number" &&
          key !== "Total" &&
          key !== "TotalMinusExclusions" &&
          key !== "Lanid" &&
          key !== "Date"
        ) {
          displayItem[key] = displayItem[key] < 0 ? 0 : displayItem[key];
        }
      });

      switch (currentView) {
        case "totalNetWithoutFirearms":
          return {
            ...displayItem,
            ...Object.fromEntries(
              Object.entries(displayItem).filter(
                ([key]) => !excludeCategoriesFromTotalFirearms.includes(key)
              )
            ),
          };
        case "totalNetWithFirearms":
          return {
            ...displayItem,
            ...Object.fromEntries(
              Object.entries(displayItem).filter(
                ([key]) => !excludeCategoriesFromChart.includes(key)
              )
            ),
          };
        default:
          return displayItem;
      }
    });

    return {
      processedData: processedDataForView,
      categories: Array.from(categories),
      totalGross,
      totalNet,
      totalNetMinusExclusions,
    };
  };

  const chartData = React.useMemo(() => {
    if (!salesData) return null;
    return processData(salesData, activeView as ChartView);
  }, [salesData, activeView]);

  const updateRangeMutation = useMutation({
    mutationFn: (date: Date) => {
      const newStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const newEnd = new Date(newStart);
      newEnd.setHours(23, 59, 59, 999);
      return Promise.resolve({ start: newStart, end: newEnd });
    },
    onSuccess: (newRange) => {
      queryClient.setQueryData(["selectedRange"], newRange);
    },
  });

  const chartConfig =
    chartData?.categories.reduce((acc, category, index) => {
      acc[category] = {
        label: category,
        color: chartColors[index % chartColors.length],
      };
      return acc;
    }, {} as ChartConfig) ?? {};

  const maxTotal = chartData?.processedData.reduce((max, item) => {
    const total = chartData.categories.reduce((sum, category) => {
      return sum + (item[category] || 0);
    }, 0);
    return Math.max(max, total);
  }, 0);

  const yAxisMax = maxTotal ? maxTotal * 1.2 : 0;

  const calculateCustomTicks = (max: number): number[] => {
    const ticks: number[] = [];

    ticks.push(0);

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

    if (max > 1250) ticks.push(1250);
    if (max > 1500) ticks.push(1500);
    if (max > 2000) ticks.push(2000);
    if (max > 2500) ticks.push(2500);

    if (max > 3000) ticks.push(3000);
    if (max > 3500) ticks.push(3500);
    if (max > 4000) ticks.push(4000);
    if (max > 5000) ticks.push(5000);
    if (max > 6000) ticks.push(6000);
    if (max > 7000) ticks.push(7000);
    if (max > 8000) ticks.push(8000);
    if (max > 9000) ticks.push(9000);
    if (max > 10000) ticks.push(10000);

    if (max > 15000) ticks.push(15000);
    if (max > 20000) ticks.push(20000);
    if (max > 25000) ticks.push(25000);

    const remaining: number = max - ticks[ticks.length - 1];
    const interval: number = remaining / 12;

    for (let i = 1; i <= 12; i++) {
      const value: number = ticks[ticks.length - 1] + interval * i;
      if (value < max) ticks.push(Math.round(value));
    }

    ticks.push(Math.ceil(max));

    return ticks;
  };

  const customTicks = maxTotal ? calculateCustomTicks(yAxisMax) : [];

  const handleRangeChange = (date: Date | undefined) => {
    if (date) {
      updateRangeMutation.mutate(date);
    }
  };

  const handleViewChange = (newView: ChartView) => {
    setViewMutation.mutate(newView);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!chartData) {
    return <div>No data available</div>;
  }

  return (
    <div style={{ minWidth: chartData?.processedData.length * 100 }}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-4 w-[calc(100vw-200px)]">
        <div className="flex flex-row items-center justify-center gap-2 px-6 py-5 sm:py-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"></h1>
        </div>
        <div className="flex">
          {[
            { key: "totalGross", label: "Total Gross Sales" },
            {
              key: "totalNetWithFirearms",
              label: "Total Net Sales With Firearms",
            },
            {
              key: "totalNetWithoutFirearms",
              label: "Total Net Sales Without Firearms",
            },
          ].map(({ key, label }) => (
            <button
              key={key}
              data-active={activeView === key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setViewMutation.mutate(key as ChartView)}
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                {currencyFormatter.format(
                  key === "totalGross"
                    ? chartData?.totalGross ?? 0
                    : key === "totalNetWithFirearms"
                    ? chartData?.totalNet ?? 0
                    : chartData?.totalNetMinusExclusions ?? 0
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ChartContainer
        config={chartConfig}
        className="min-h-[20px] max-h-[400px] w-[calc(100vw-200px)]"
      >
        <BarChart
          data={chartData.processedData}
          height={300}
          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default SalesRangeStackedBarChart;
