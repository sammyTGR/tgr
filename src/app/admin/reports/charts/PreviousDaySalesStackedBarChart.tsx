// src/app/admin/reports/charts/PreviousDaySalesStackedBarChart.tsx
"use client";

import { EventProps } from "@tremor/react";
import React, { useEffect, useState } from "react";
import { BarChart } from "@/components/BarChart"; // Import your custom BarChart
import { useTheme } from "next-themes";
import { ResponsiveContainer } from "recharts";

interface ChartData {
  Lanid: string;
  Date: string;
  [key: string]: any;
}

const fetchData = async () => {
  const response = await fetch("/api/fetch-previous-day-sales-data");
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const processData = (data: any[]) => {
  const processedData: ChartData[] = [];
  const categories: Set<string> = new Set();
  let totalSales = 0;
  let totalMinusFirearms = 0;

  const excludeCategories = [
    "Pistol",
    "Rifle",
    "Revolver",
    "Shotgun",
    "Receiver",
    "CA Tax Gun Transfer",
    "CA Tax Adjust",
  ];

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
    totalSales += value;
    if (!excludeCategories.includes(category)) {
      totalMinusFirearms += value;
    }
    categories.add(category);
  });

  return {
    processedData,
    categories: Array.from(categories),
    totalSales,
    totalMinusFirearms,
  };
};

const PreviousDaySalesStackedBarChart = () => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [date, setDate] = useState<string>("");
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalMinusFirearms, setTotalMinusFirearms] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData();
        const { processedData, categories, totalSales, totalMinusFirearms } =
          processData(data);

        if (processedData.length > 0) {
          const dates = processedData
            .map((d) => new Date(d.Date))
            .filter((date) => !isNaN(date.getTime()));

          if (dates.length > 0) {
            const previousDay = new Date(
              Math.max(...dates.map((d) => d.getTime()))
            );
            setDate(previousDay.toISOString().split("T")[0]);
          }
        }

        setChartData(processedData);
        setCategories(categories);
        setTotalSales(totalSales);
        setTotalMinusFirearms(totalMinusFirearms);
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
          Sales By Employee and Category for Previous Day
        </p>
        <p className="mx-auto text-lg font-bold">
          Total Sales: ${totalSales.toFixed(2)}
        </p>
        <p className="mx-auto text-lg font-bold">
          Total - Firearms & Transfer Tax: ${totalMinusFirearms.toFixed(2)}
        </p>
        <p className="mx-auto text-sm font-medium">{date}</p>
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
            />
          </div>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default PreviousDaySalesStackedBarChart;
