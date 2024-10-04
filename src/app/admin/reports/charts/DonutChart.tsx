// src/app/admin/reports/charts/SalesDonutChart.tsx

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, Title, Text } from "@tremor/react";

const fetchData = async () => {
  const response = await fetch("/api/fetch-sales-data-aggregated", {
    method: "GET",
    headers: {
      "Cache-Control": "no-store",
    },
  });
  const data = await response.json();
  return data;
};

const dataFormatter = (number: number) =>
  `$ ${Intl.NumberFormat("us").format(number).toString()}`;

const SalesDonutChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData();
        setChartData(data);
      } catch (error) {
        //console.("Error fetching chart data:", error);
      }
    };

    loadData();
  }, []);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#FF6347",
    "#6A5ACD",
    "#8A2BE2",
    "#DEB887",
    "#5F9EA0",
    "#D2691E",
    "#FF7F50",
    "#6495ED",
    "#DC143C",
    "#00FFFF",
    "#B8860B",
    "#006400",
  ];

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col">
      <Card className="p-6">
        <Title>Sales by Category</Title>
        <Text className="mb-4">
          Total sales price multiplied by quantity sold
        </Text>
        <div className="flex flex-col">
          <div style={{ width: "100%", maxWidth: "900px", height: "400px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SalesDonutChart;
