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

const fetchData = async () => {
  const response = await fetch("/api/fetch-sales-data-aggregated");
  const data = await response.json();
  return data;
};

const processData = (data: any[]) => {
  const processedData: any[] = [];
  const categories: Set<string> = new Set();

  data.forEach((item) => {
    const category = item.name; // Adjusted to match your fetched data structure
    const value = item.value;

    const existingCategory = processedData.find((d) => d.category === category);
    if (existingCategory) {
      existingCategory[category] = value;
    } else {
      const newEntry: any = { category };
      newEntry[category] = value;
      processedData.push(newEntry);
    }

    categories.add(category);
  });

  return { processedData, categories: Array.from(categories) };
};

const StackedBarChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
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
        //console.("Error fetching chart data:", error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className="mx-auto font-mono text-sm font-medium">Sales By Category</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          {categories.map((category, index) => (
            <Bar
              type="stacked"
              key={index}
              dataKey={category}
              stackId="a"
              fill={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StackedBarChart;
