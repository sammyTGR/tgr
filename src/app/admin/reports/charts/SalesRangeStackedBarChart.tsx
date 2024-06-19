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

interface SalesRangeStackedBarChartProps {
  selectedRange: { start: Date | undefined; end: Date | undefined };
}

const SalesRangeStackedBarChart: React.FC<SalesRangeStackedBarChartProps> = ({
  selectedRange,
}) => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalGross, setTotalGross] = useState<number>(0);
  const [totalGrossMinusExclusions, setTotalGrossMinusExclusions] =
    useState<number>(0);
  const [totalNet, setTotalNet] = useState<number>(0);

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
            totalGross,
            totalGrossMinusExclusions,
            totalNet,
          } = processData(data);

          setChartData(processedData);
          setCategories(categories);
          setTotalGross(totalGross);
          setTotalGrossMinusExclusions(totalGrossMinusExclusions);
          setTotalNet(totalNet);
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
          Total Gross Sales: ${totalGross.toFixed(2)}
        </p>
        <p className="text-sm font-medium">
          Total Net Sales: ${totalNet.toFixed(2)}
        </p>
        <p className="text-sm font-medium">
          Total - Firearms: ${totalGrossMinusExclusions.toFixed(2)}
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
