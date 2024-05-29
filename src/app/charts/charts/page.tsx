import { LineChart, Line } from "recharts";
import Charts from "../charts";

const renderLineChart = () => {
  return (
    <>
      <div className="flex">
        <main className="flex-grow ml-64 relative">
          <Charts />
        </main>
      </div>
    </>
  );
};
export default renderLineChart;
