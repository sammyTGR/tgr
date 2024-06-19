"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "next-themes";
import { ResponsiveContainer } from "recharts";

interface ChartData {
  Lanid: string;
  Date: string;
  [key: string]: any;
}

const fetchData = async (startDate: string, endDate: string) => {
  const response = await fetch(
    `/api/fetch-sales-data-by-range?start=${startDate}&end=${endDate}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const processData = (data: any[]) => {
  const processedData: ChartData[] = [];
  const categories: Set<string> = new Set();
  const excludeCategoriesFromChart = ["CA Tax Gun Transfer", "CA Tax Adjust"];
  const excludeCategoriesFromTotalFirearms = [
    "Pistol",
    "Rifle",
    "Revolver",
    "Shotgun",
    "Receiver",
    ...excludeCategoriesFromChart,
  ];

  let totalSales = 0;
  let totalSalesMinusExclusions = 0;
  let totalCost = 0;

  data.forEach((item) => {
    const lanid = item.Lanid;
    const category = item.category_label;
    const value = (item.SoldPrice ?? 0) * (item.SoldQty ?? 0);
    const costValue = (item.Cost ?? 0) * (item.SoldQty ?? 0);

    totalSales += value;
    totalCost += costValue;

    if (!excludeCategoriesFromTotalFirearms.includes(category)) {
      totalSalesMinusExclusions += value;
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

      existingEntry[category] = value;
      existingEntry.Total += value;
      if (!excludeCategoriesFromTotalFirearms.includes(category)) {
        existingEntry.TotalMinusExclusions += value;
      }
      categories.add(category);
    }
  });

  const totalNetSales = totalSales - totalCost;

  return {
    processedData,
    categories: Array.from(categories),
    totalSales,
    totalSalesMinusExclusions,
    totalNetSales,
  };
};

interface SalesRangeStackedBarChartProps {
  selectedRange: { start: Date | undefined; end: Date | undefined };
}

const SalesRangeStackedBarChart: React.FC<SalesRangeStackedBarChartProps> = ({
  selectedRange,
}) => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [totalSalesMinusExclusions, setTotalSalesMinusExclusions] =
    useState<number>(0);
  const [totalNetSales, setTotalNetSales] = useState<number>(0);

  useEffect(() => {
    if (selectedRange.start && selectedRange.end) {
      const loadData = async () => {
        try {
          const data = await fetchData(
            selectedRange.start?.toISOString().split("T")[0] ?? "",
            selectedRange.end?.toISOString().split("T")[0] ?? ""
          );
          const {
            processedData,
            categories,
            totalSales,
            totalSalesMinusExclusions,
            totalNetSales,
          } = processData(data);

          setChartData(processedData);
          setCategories(categories);
          setTotalSales(totalSales);
          setTotalSalesMinusExclusions(totalSalesMinusExclusions);
          setTotalNetSales(totalNetSales);
        } catch (error) {
          if (error instanceof Error) {
            console.error("Error fetching chart data:", error.message);
          } else {
            console.error("Error fetching chart data:", error);
          }
        }
      };

      loadData();
    }
  }, [selectedRange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-start">
        <p className="text-sm font-medium">
          Total Gross Sales: ${totalSales.toFixed(2)}
        </p>
        <p className="text-sm font-medium">
          Total Net Sales: ${totalNetSales.toFixed(2)}
        </p>
        <p className="text-sm font-medium">
          Total - Firearms: ${totalSalesMinusExclusions.toFixed(2)}
        </p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <div className="overflow-x-auto">
          <div style={{ minWidth: chartData.length * 100 }}>
            <BarChart
              data={chartData}
              index="Lanid"
              categories={categories}
              type="stacked"
              showLegend={true}
              showTooltip={true}
              className="h-96 mb-4"
              xAxisProps={{
                interval: 0,
                angle: -30,
                textAnchor: "end",
                height: 60,
              }}
            />
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesRangeStackedBarChart;
