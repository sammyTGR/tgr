import AuditsByDayChart from "@/app/charts/AuditsByDayChart";
import { render } from "react-dom";
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import BarChartPlot from "./BarChartPlot";
import React from "react";

const data = [BarChartPlot];

const Charts = () => {
  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart width={730} height={250} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="high" fill="#82ca9d" />
          <Bar dataKey="low" fill="#FA8072" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
};
export default Charts;
