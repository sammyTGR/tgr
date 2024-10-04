"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { CustomCalendar } from "@/components/ui/calendar";
import { DataTable } from "./data-table";
import { RenderDropdown } from "./dropdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Assuming you have a button component

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
  audit_date: string; // Ensure this is included
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
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("lanid");
      if (error) {
        //console.(error);
      } else {
        setEmployees(data);
      }
    };

    const fetchPointsCalculation = async () => {
      const { data, error } = await supabase
        .from("points_calculation")
        .select("*");
      if (error) {
        //console.(error);
      } else {
        setPointsCalculation(data);
      }
    };

    fetchEmployees();
    fetchPointsCalculation();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedMonth) {
        // Format the date to YYYY-MM-DD for the database query
        const startDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        )
          .toISOString()
          .split("T")[0];
        const endDate = new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1,
          0
        )
          .toISOString()
          .split("T")[0];

        if (showAllEmployees) {
          const { data: allAuditData, error: allAuditError } = await supabase
            .from("Auditsinput")
            .select("*")
            .gte("audit_date", startDate)
            .lte("audit_date", endDate);

          if (allAuditError) {
            //console.(allAuditError);
          } else {
            const lanids = Array.from(
              new Set(allAuditData.map((audit) => audit.salesreps))
            );
            const { data: allSalesData, error: allSalesError } = await supabase
              .from("sales_data")
              .select("*")
              .in("Lanid", lanids)
              .gte("Date", startDate)
              .lte("Date", endDate)
              .not("subcategory_label", "is", null)
              .not("subcategory_label", "eq", "");

            if (allSalesError) {
              //console.(allSalesError);
            } else {
              setSalesData(allSalesData);
              setAuditData(allAuditData);
              calculateSummary(
                allSalesData,
                allAuditData,
                selectedMonth,
                lanids
              );
            }
          }
        } else if (selectedLanid) {
          const { data: salesData, error: salesError } = await supabase
            .from("sales_data")
            .select("*")
            .eq("Lanid", selectedLanid)
            .gte("Date", startDate)
            .lte("Date", endDate)
            .not("subcategory_label", "is", null)
            .not("subcategory_label", "eq", "");

          const { data: auditData, error: auditError } = await supabase
            .from("Auditsinput")
            .select("*")
            .eq("salesreps", selectedLanid)
            .gte("audit_date", startDate)
            .lte("audit_date", endDate);

          if (salesError || auditError) {
            //console.(salesError || auditError);
          } else {
            setSalesData(salesData);
            setAuditData(auditData);
            calculateSummary(salesData, auditData, selectedMonth, [
              selectedLanid,
            ]);
          }
        }
      }
    };

    fetchData();

    const salesSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales_data" },
        (payload) => {
          // console.log("Sales data changed:", payload);
          fetchData();
        }
      )
      .subscribe();

    const auditsSubscription = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Auditsinput" },
        (payload) => {
          // console.log("Audit data changed:", payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(salesSubscription);
      supabase.removeChannel(auditsSubscription);
    };
  }, [selectedLanid, selectedMonth, pointsCalculation, showAllEmployees]);

  const calculateSummary = (
    salesData: SalesData[],
    auditData: AuditInput[],
    selectedMonth: Date,
    lanids: string[]
  ) => {
    let summary = lanids.map((lanid) => {
      const employeeSalesData = salesData.filter(
        (sale) => sale.Lanid === lanid
      );
      const employeeAuditData = auditData.filter(
        (audit) => audit.salesreps === lanid
      );

      const totalDros = employeeSalesData.filter(
        (sale) => sale.subcategory_label
      ).length;
      let pointsDeducted = 0;

      // console.log("Calculating points deducted...");
      employeeSalesData.forEach((sale: SalesData) => {
        if (sale.dros_cancel === "Yes") {
          // console.log(
          //   `DROS canceled for sale id ${sale.id}. Deducting 5 points.`
          // );
          pointsDeducted += 5;
        }
      });

      employeeAuditData.forEach((audit: AuditInput) => {
        const auditDate = new Date(audit.audit_date);
        if (auditDate <= selectedMonth) {
          pointsCalculation.forEach((point: PointsCalculation) => {
            if (audit.error_location === point.error_location) {
              // console.log(
              //   `Deducting ${point.points_deducted} points for error location ${audit.error_location} for audit id ${audit.id}.`
              // );
              pointsDeducted += point.points_deducted;
            } else if (
              point.error_location === "dros_cancel_field" &&
              audit.dros_cancel === "Yes"
            ) {
              // console.log(
              //   `Deducting ${point.points_deducted} points for DROS cancellation for audit id ${audit.id}.`
              // );
              pointsDeducted += point.points_deducted;
            }
          });
        }
      });

      // console.log("Points deducted:", pointsDeducted);
      const totalPoints = 300 - pointsDeducted;

      return {
        Lanid: lanid,
        TotalDros: totalDros,
        PointsDeducted: pointsDeducted,
        TotalPoints: totalPoints,
      };
    });

    // Sort summary data by Total Points in descending order
    summary.sort((a, b) => b.TotalPoints - a.TotalPoints);
    setSummaryData(summary);
  };
  return (
    <Card className="w-full max-w-6xl mx-auto p-4 my-8">
      <div className="flex space-x-4 mb-4">
        <div className="w-full">
          <RenderDropdown
            field={{ onChange: setSelectedLanid }}
            options={employees.map((emp) => ({
              value: emp.lanid,
              label: emp.lanid,
            }))}
            placeholder="Select Employee"
          />
        </div>
        <CustomCalendar
          selectedDate={selectedMonth}
          onDateChange={(date: Date | undefined) => setSelectedMonth(date)}
          disabledDays={() => false} // Adjust this if needed
        />
      </div>
      <div className="mb-4">
        <Button onClick={() => setShowAllEmployees((prev) => !prev)}>
          {showAllEmployees ? "Show Selected Employee" : "Show All Employees"}
        </Button>
      </div>
      <div className="text-left">
        <DataTable
          columns={[
            { Header: "Sales Rep", accessor: "Lanid" },
            { Header: "Total DROS", accessor: "TotalDros" },
            { Header: "Points Deducted", accessor: "PointsDeducted" },
            { Header: "Total Points", accessor: "TotalPoints" },
          ]}
          data={summaryData}
        />
      </div>
    </Card>
  );
};

export default ContestPage;
