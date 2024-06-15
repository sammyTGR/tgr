"use client";
import { AreaChartOnValueChangeExample } from "./AreaOnValueChange";
import SalesDonutChart from "./DonutChart";
import SalesPieChart from "./SalesPieChart";

export default function Charts() {
  return (
    <>
    <div className="flex grid grid-cols-4 md:grid-cols-2 lg:grid-cols-3 space-x-6 my-4 p-4">
    <div className="flex gap-2">
      <SalesDonutChart />
      {/* <SalesPieChart /> */}
    </div>
    
  </div>
  <div className="flex grid grid-col-2 my-4 max-w-4xl p-4">
  {/* <AreaChartOnValueChangeExample /> */}
  </div>
  </>
  );
}
