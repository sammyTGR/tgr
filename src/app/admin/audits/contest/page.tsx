"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { CustomCalendar } from "@/components/ui/calendar";
import { DataTable } from "./data-table";
import { RenderDropdown } from "./dropdown";

interface Employee {
  lanid: string;
}

interface SalesData {
  id: number;
  Lanid: string;
  subcategory_label: string;
  dros_cancel: string | null;
  // other fields
}

interface AuditInput {
  id: string;
  salesreps: string;
  error_location: string;
  category: string;
  dros_cancel: string | null;
  // other fields
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

const ContestPage = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLanid, setSelectedLanid] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(
    undefined
  );
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [auditData, setAuditData] = useState<AuditInput[]>([]);
  const [pointsCalculation, setPointsCalculation] = useState<
    PointsCalculation[]
  >([]);
  const [totalPoints, setTotalPoints] = useState<number>(300);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("lanid");
      if (error) {
        console.error(error);
      } else {
        setEmployees(data);
      }
    };

    const fetchPointsCalculation = async () => {
      const { data, error } = await supabase
        .from("points_calculation")
        .select("*");
      if (error) {
        console.error(error);
      } else {
        setPointsCalculation(data);
      }
    };

    fetchEmployees();
    fetchPointsCalculation();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedLanid && selectedMonth) {
        const { data: salesData, error: salesError } = await supabase
          .from("sales_data")
          .select("*")
          .eq("Lanid", selectedLanid)
          .not("subcategory_label", "is", null)
          .not("subcategory_label", "eq", "");

        const { data: auditData, error: auditError } = await supabase
          .from("Auditsinput")
          .select("*")
          .eq("salesreps", selectedLanid)
          .gte(
            "audit_date",
            new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
          )
          .lte(
            "audit_date",
            new Date(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth() + 1,
              0
            )
          );

        if (salesError || auditError) {
          console.error(salesError || auditError);
        } else {
          setSalesData(salesData);
          setAuditData(auditData);

          // Calculate points
          let totalPoints = 300;

          // Check sales data for DROS cancellations
          salesData.forEach((sale: SalesData) => {
            if (sale.dros_cancel === "Yes") {
              totalPoints -= 5;
            }
          });

          // Check audit data for points deductions
          auditData.forEach((audit: AuditInput) => {
            pointsCalculation.forEach((point: PointsCalculation) => {
              if (
                audit.category === point.category &&
                audit.error_location === point.error_location
              ) {
                totalPoints -= point.points_deducted;
              } else if (
                point.error_location === "dros_cancel_field" &&
                audit.dros_cancel === "Yes"
              ) {
                totalPoints -= point.points_deducted;
              }
            });
          });

          setTotalPoints(totalPoints);
        }
      }
    };

    fetchData();
  }, [selectedLanid, selectedMonth, pointsCalculation]);

  return (
    <div>
      <div className="flex space-x-4 mb-4">
        <RenderDropdown
          field={{ onChange: setSelectedLanid }}
          options={employees.map((emp) => ({
            value: emp.lanid,
            label: emp.lanid,
          }))}
          placeholder="Select Employee"
        />
        <CustomCalendar
          selectedDate={selectedMonth}
          onDateChange={(date: Date | undefined) => setSelectedMonth(date)}
          disabledDays={() => false} // Adjust this if needed
        />
      </div>
      <DataTable
        columns={[
          { Header: "Sales Data", accessor: "Lanid" },
          { Header: "Subcategory", accessor: "subcategory_label" },
          { Header: "DROS Cancel", accessor: "dros_cancel" },
          // other sales data columns
        ]}
        data={salesData}
      />
      <DataTable
        columns={[
          { Header: "Audit Data", accessor: "salesreps" },
          { Header: "Error Location", accessor: "error_location" },
          { Header: "Category", accessor: "category" },
          // other audit data columns
        ]}
        data={auditData}
      />
      <div>
        <h3>Points Calculation</h3>
        <p>Total Points: {totalPoints}</p>
      </div>
    </div>
  );
};

export default ContestPage;
