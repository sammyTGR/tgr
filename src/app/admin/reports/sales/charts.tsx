// src/app/admin/reports/sales/SalesDonutChart.tsx
import React, { useEffect, useState } from "react";
import { DonutChart, Card, Title, Text } from "@tremor/react";

const dataFormatter = (number: number) =>
  `$ ${Intl.NumberFormat("us").format(number).toString()}`;

interface ChartData {
  name: string;
  value: number;
}

const SalesDonutChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/fetch-sales-data-aggregated");
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Card className="p-6">
      <Title>Sales by Category</Title>
      <Text className="mb-4">
        Total sales price multiplied by quantity sold
      </Text>
      <div className="flex justify-center">
        <div style={{ width: "100%", maxWidth: "600px", height: "600px" }}>
          <DonutChart
            data={chartData}
            category="value"
            index="name"
            valueFormatter={dataFormatter}
            colors={[
              "blue-900",
              "blue-800",
              "blue-700",
              "blue-600",
              "blue-500",
              "blue-400",
            ]}
          />
        </div>
      </div>
    </Card>
  );
};

export default SalesDonutChart;
