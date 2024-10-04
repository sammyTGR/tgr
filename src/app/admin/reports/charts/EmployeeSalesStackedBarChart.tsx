// src/app/admin/reports/charts/EmployeeSalesStackedBarChart.tsx
"use client";

import { EventProps } from "@tremor/react";
import React, { useEffect, useState } from "react";
import { BarChart } from "@/components/BarChart"; // Import your custom BarChart
import { ResponsiveContainer } from "recharts";

interface ChartData {
  Lanid: string;
  Date: string;
  [key: string]: any;
}

const fetchData = async () => {
  const response = await fetch("/api/fetch-sales-data-by-employee");
  const data = await response.json();
  // console.log("Fetched data from API:", data.length, "records"); // Log fetched data length
  // console.log("Fetched data sample:", data.slice(0, 5)); // Log a sample of the fetched data
  return data;
};

const processData = (data: any[]) => {
  const processedData: ChartData[] = [];
  const categories: Set<string> = new Set();
  const lanidSet: Set<string> = new Set();

  data.forEach((item) => {
    const lanid = item.Lanid;
    const category = item.category_label;
    const value = item.total_sales;

    let existingEntry = processedData.find((d) => d.Lanid === lanid);
    if (!existingEntry) {
      existingEntry = { Lanid: lanid, Date: item.Date };
      processedData.push(existingEntry);
    }

    existingEntry[category] = value;
    categories.add(category);
    lanidSet.add(lanid);
  });

  // console.log("Processed Data:", processedData); // Log processed data
  // console.log("Unique Lanid values:", Array.from(lanidSet)); // Log unique Lanid values

  return { processedData, categories: Array.from(categories) };
};

const EmployeeSalesStackedBarChart = () => {
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

            // console.log("Date Range:", {
            //   start: start.toISOString().split("T")[0],
            //   end: end.toISOString().split("T")[0],
            // }); // Log date range
          }
        }

        setChartData(processedData);
        setCategories(categories);
      } catch (error) {
        if (error instanceof Error) {
          //console.("Error fetching chart data:", error.message);
        } else {
          //console.("Error fetching chart data:", error);
        }
      }
    };

    loadData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <div className="flex flex-col gap-4">
        <p className="mx-auto text-sm font-medium">
          Sales By Employee and Category
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
    </ResponsiveContainer>
  );
};

export default EmployeeSalesStackedBarChart;
