"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@/components/BarChart"; // Import your custom BarChart
import { ResponsiveContainer } from "recharts";

interface ChartData {
  Lanid: string;
  Date: string;
  [key: string]: any;
}

const fetchData = async () => {
  const response = await fetch("/api/fetch-all-time-sales-data");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const processData = (data: any[]) => {
  const processedData: ChartData[] = [];
  const categories: Set<string> = new Set();

  data.forEach((item) => {
    const lanid = item.Lanid;
    const category = item.category_label;
    const value = item.SoldPrice * item.SoldQty;

    let existingEntry = processedData.find((d) => d.Lanid === lanid);
    if (!existingEntry) {
      existingEntry = { Lanid: lanid, Date: item.Date };
      processedData.push(existingEntry);
    }

    existingEntry[category] = value;
    categories.add(category);
  });

  return { processedData, categories: Array.from(categories) };
};

const AllTimeSalesStackedBarChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData();
        const { processedData, categories } = processData(data);

        if (processedData.length > 0) {
          const dates = processedData
            .map((d) => new Date(d.Date))
            .filter((date) => !isNaN(date.getTime()));

          if (dates.length > 0) {
            const start = new Date(Math.min(...dates.map((d) => d.getTime())));
            const end = new Date(Math.max(...dates.map((d) => d.getTime())));

            setDateRange({
              start: start.toISOString().split("T")[0],
              end: end.toISOString().split("T")[0],
            });
          }
        }

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
      <p className="mx-auto text-sm font-medium">
        Sales By Employee and Category for All Time
      </p>
      <p className="mx-auto text-sm font-medium">
        {dateRange.start} to {dateRange.end}
      </p>
      <div className="overflow-x-auto">
        <div style={{ minWidth: chartData.length * 100 }}>
          <BarChart
            data={chartData}
            index="Lanid"
            categories={categories}
            type="stacked"
            showLegend={true}
            showTooltip={true}
            className="h-96"
            xAxisProps={{
              interval: 0,
              angle: -45,
              textAnchor: "end",
              height: 60,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AllTimeSalesStackedBarChart;
