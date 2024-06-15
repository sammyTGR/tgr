// src/app/admin/reports/charts/EmployeeSalesStackedBarChart.tsx
"use client";

import { EventProps } from "@tremor/react";
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  Lanid: string;
  [key: string]: any;
}

const fetchData = async () => {
  const response = await fetch("/api/fetch-sales-data-by-employee");
  const data = await response.json();
  return data;
};

const processData = (data: any[]) => {
  const processedData: ChartData[] = [];
  const categories: Set<string> = new Set();

  data.forEach((item) => {
    const lanid = item.Lanid;
    const category = item.category_label;
    const value = item.total_sales;

    let existingEntry = processedData.find((d) => d.Lanid === lanid);
    if (!existingEntry) {
      existingEntry = { Lanid: lanid };
      processedData.push(existingEntry);
    }

    existingEntry[category] = value;
    categories.add(category);
  });

  return { processedData, categories: Array.from(categories) };
};

const EmployeeSalesStackedBarChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [value, setValue] = React.useState<EventProps>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData();
        const { processedData, categories } = processData(data);
        setChartData(processedData);
        setCategories(categories);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching chart data:", error.message);
        } else {
          console.error("Error fetching chart data:", error);
        }
      }
    };

    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="mx-auto font-mono text-sm font-medium">
        Sales By Employee and Category
      </p>
      <div className="overflow-x-auto">
        <ResponsiveContainer width={chartData.length * 100} height={600}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barCategoryGap="1%" // Reduce to group bars closer
            barSize={20} // Set explicit bar size if needed
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Lanid" />
            <YAxis />
            <Tooltip />
            <Legend />
            {categories.map((category, index) => (
              <Bar
                key={index}
                dataKey={category}
                stackId="a"
                fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EmployeeSalesStackedBarChart;
