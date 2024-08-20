"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "@/components/BarChart";
import { supabase } from "@/utils/supabase/client";

interface ChartData {
  errorDetails: string;
  count: number;
}

interface PerformanceBarChartProps {
  employeeId: string;
  selectedDate: Date | null; // Allow null
}

const fetchData = async (employeeId: string) => {
  const { data, error } = await supabase
    .from("Auditsinput")
    .select("error_details")
    .eq("salesreps", employeeId);

  if (error) {
    console.error("Error fetching audit data:", error);
    return [];
  }

  return data;
};

const PerformanceBarChart: React.FC<PerformanceBarChartProps> = ({
  employeeId,
  selectedDate,
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadChartData = async () => {
      const data = await fetchData(employeeId);
      const groupedData = data.reduce((acc: any, item: any) => {
        const errorDetails = item.error_details;
        if (!acc[errorDetails]) {
          acc[errorDetails] = { errorDetails, count: 0 };
        }
        acc[errorDetails].count += 1;
        return acc;
      }, {});

      const chartDataArray = Object.values(groupedData) as ChartData[];
      const categoryLabels = chartDataArray.map((item) => item.errorDetails);

      setChartData(chartDataArray);
      setCategories(categoryLabels);
    };

    loadChartData();
  }, [employeeId, selectedDate]);

  return (
    <div className="w-full h-96">
      <BarChart
        data={chartData}
        index="errorDetails"
        categories={categories}
        showLegend={true}
        showTooltip={true}
        className="h-full"
      />
    </div>
  );
};

export default PerformanceBarChart;
