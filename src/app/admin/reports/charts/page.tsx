"use client";
import { useState } from "react";
import { CustomCalendar } from "@/components/ui/calendar";
import SalesRangeStackedBarChart from "./SalesRangeStackedBarChart";
import AllTimeSalesStackedBarChart from "./AllTimeSalesStackedBarChart";
import CurrentWeekSalesStackedBarChart from "./CurrentWeekSalesStackedBarChart";
import PreviousDaySalesStackedBarChart from "./PreviousDaySalesStackedBarChart";

export default function Charts() {
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined,
  });

  const handleDateRangeChange = (date: Date | undefined) => {
    if (date) {
      setSelectedRange({ start: date, end: date });
    }
  };

  return (
    <>
      <div className="flex flex-col p-4">
        <CustomCalendar
          selectedDate={selectedRange.start}
          onDateChange={handleDateRangeChange}
          disabledDays={() => false}
        />
      </div>

      <div className="flex grid grid-cols-4 space-x-4 p-4">
        <SalesRangeStackedBarChart selectedRange={selectedRange} />
        <AllTimeSalesStackedBarChart />
        <CurrentWeekSalesStackedBarChart />
        <PreviousDaySalesStackedBarChart />
      </div>
    </>
  );
}
