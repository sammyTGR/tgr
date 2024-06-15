"use client";
import { AreaChartOnValueChangeExample } from "./AreaOnValueChange";
import CurrentWeekSalesStackedBarChart from "./CurrentWeekSalesStackedBarChart";
import SalesDonutChart from "./DonutChart";
import EmployeeSalesStackedBarChart from "./EmployeeSalesStackedBarChart";
import SalesPieChart from "./SalesPieChart";
import StackedBarChart from "./StackedBarChart";

export default function Charts() {
  return (
    <>
      <div className="flex grid grid-cols-2">
        <SalesDonutChart />
      </div>
      <div className="flex grid grid-cols-1 max-w-8xl ml-4 my-4 overflow-x-auto">
        <EmployeeSalesStackedBarChart />
      </div>
      <div className="flex grid grid-cols-1  ml-4 my-4 overflow-x-auto">
        <CurrentWeekSalesStackedBarChart />
      </div>
    </>
  );
}
