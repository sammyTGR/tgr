"use client";
import { AreaChartOnValueChangeExample } from "./AreaOnValueChange";
import SalesDonutChart from "./DonutChart";
import EmployeeSalesStackedBarChart from "./EmployeeSalesStackedBarChart";
import SalesPieChart from "./SalesPieChart";
import StackedBarChart from "./StackedBarChart";

export default function Charts() {
  return (
    <>
      <div className="flex grid grid-cols-2">
        <SalesDonutChart />
        {/* <SalesPieChart /> */}
      </div>
      <div className="flex grid grid-col-2 ml-4 my-4 max-w-4xl p-4">
        <StackedBarChart />
      </div>
      <div className="flex w-full ml-4 my-4 overflow-x-auto">
        <EmployeeSalesStackedBarChart />
      </div>
    </>
  );
}
