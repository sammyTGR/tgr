// src/app/admin/reports/charts/SalesDonutChart.tsx
import React, { useEffect, useState } from "react";
import { DonutChart, Card, Title, Text, EventProps } from "@tremor/react";

const dataFormatter = (number: number) =>
  `$ ${Intl.NumberFormat("us").format(number).toString()}`;

interface ChartData {
  name: string;
  value: number;
}

const SalesDonutChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [value, setValue] = React.useState<EventProps>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/fetch-sales-data-aggregated", {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-store'
          }
        });
        const data = await response.json();
        console.log('Chart Data:', data);
        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      <Card className="p-6">
        <Title>Sales by Category</Title>
        <Text className="mb-4">
          Total sales price multiplied by quantity sold
        </Text>
        <div className="flex flex-col">
          <div style={{ width: "100%", maxWidth: "600px", height: "200px" }}>
            <DonutChart
              data={chartData}
              category="value"
              index="name"
              valueFormatter={dataFormatter}
              // colors={[
              //   "blue-900",
              //   "emerald-500",
              //   "pink-700",
              //   "amber-600",
              //   "blue-500",
              //   "blue-400",
              //   "blue-300",
              //   "purple-400",
              //   "yellow-500",
              //   "orange-500",
              //   "amber-200",
              //   "indigo-600",
              //   "red-500",
              //   "red-300",
              //   "green-600",
              //   "fuchsia-500",
              //   "fuchsia-300",
              // ]}
              onValueChange={(v) => setValue(v)}
            />
            <pre className="mt-8 rounded-md bg-gray-950 p-3 text-sm text-white dark:bg-gray-800">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SalesDonutChart;
