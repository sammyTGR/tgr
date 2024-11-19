"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import SubmitAuditForm from "./submit/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SupportNavMenu from "@/components/ui/SupportNavMenu";
import { DataTable } from "@/components/ui/data-table";
import { AuditData, createColumns } from "./review/columns";
import { supabase } from "@/utils/supabase/client";
import { SubmitFormData } from "./submit/PopoverForm";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RenderDropdown } from "./contest/dropdown";
import { DataTableProfile } from "./contest/data-table-profile";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { CustomCalendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import LoadingIndicator from "@/components/LoadingIndicator";
import dynamic from "next/dynamic";
import { WeightedScoringCalculator } from "./contest/WeightedScoringCalculator";
import * as XLSX from "xlsx";

type OptionType = {
  label: string;
  value: string;
};

type CellProps = {
  value: any;
  row: {
    original: {
      Qualified: boolean;
      isDivider?: boolean;
      [key: string]: any;
    };
  };
};

type ColumnDef = {
  Header: string;
  accessor: string;
  Cell?: (props: CellProps) => JSX.Element;
};

interface DataRow {
  salesreps?: string;
}

interface Employee {
  lanid: string;
  department?: string;
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

interface Audit {
  dros_number: string;
  salesreps: string;
  audit_type: string;
  trans_date: string;
  audit_date: string;
  error_location: string;
  error_details: string;
  error_notes: string;
  dros_cancel: string;
}

interface SummaryRowData {
  Lanid: string;
  TotalDros: number | null;
  MinorMistakes: number | null;
  MajorMistakes: number | null;
  CancelledDros: number | null;
  WeightedErrorRate: number | null;
  Qualified: boolean;
  DisqualificationReason: string;
  isDivider?: boolean;
}

const LazyDataTable = dynamic(
  () =>
    import("@/components/ui/data-table").then((module) => ({
      default: module.DataTable,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

const LazyDataTableProfile = dynamic(
  () =>
    import("./contest/data-table-profile").then((module) => ({
      default: module.DataTableProfile,
    })),
  {
    loading: () => <LoadingIndicator />,
  }
);

export default function AuditsPage() {
  const [activeTab, setActiveTab] = useState("submit");
  const [dataMap, setDataMap] = useState<Map<string, AuditData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [salesRepOptions, setSalesRepOptions] = useState<OptionType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLanid, setSelectedLanid] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchText, setSearchText] = useState("");
  const [audits, setAudits] = useState<AuditData[]>([]);
  const [pointsCalculation, setPointsCalculation] = useState<
    PointsCalculation[]
  >([]);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchPointsCalculation = async () => {
      const { data, error } = await supabase
        .from("points_calculation")
        .select("*");
      if (error) {
        //console.("Error fetching points calculation:", error);
      } else {
        setPointsCalculation(data);
      }
    };

    fetchPointsCalculation();
  }, []);

  const fetchAndCalculateSummary = async (date: Date | null) => {
    if (!date) return;

    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    try {
      let employeesQuery = supabase
        .from("employees")
        .select("lanid, department");

      let salesQuery = supabase
        .from("sales_data")
        .select("*")
        .gte("Date", startDate)
        .lte("Date", endDate)
        .not("subcategory_label", "is", null)
        .not("subcategory_label", "eq", "");

      let auditQuery = supabase
        .from("Auditsinput")
        .select("*")
        .gte("audit_date", startDate)
        .lte("audit_date", endDate);

      if (!showAllEmployees && selectedLanid) {
        salesQuery = salesQuery.eq("Lanid", selectedLanid);
        auditQuery = auditQuery.eq("salesreps", selectedLanid);
      }

      const [
        { data: employeesData, error: employeesError },
        { data: salesData, error: salesError },
        { data: auditData, error: auditError },
        { data: pointsCalcData, error: pointsCalcError },
      ] = await Promise.all([
        employeesQuery,
        salesQuery,
        auditQuery,
        supabase.from("points_calculation").select("*"),
      ]);

      if (salesError || auditError || employeesError || pointsCalcError) {
        console.error(
          salesError || auditError || employeesError || pointsCalcError
        );
        return;
      }

      setAudits(auditData || []);

      const employeeDepartments = new Map(
        employeesData?.map((emp) => [emp.lanid, emp.department]) || []
      );

      const lanids = showAllEmployees
        ? Array.from(new Set(salesData.map((sale) => sale.Lanid)))
        : [selectedLanid];

      let summary = lanids.map((lanid) => {
        const employeeSalesData = salesData.filter(
          (sale) => sale.Lanid === lanid
        );
        const employeeAuditData = auditData.filter(
          (audit) => audit.salesreps === lanid
        );

        const department = employeeDepartments.get(lanid);
        const isOperations = department?.toString() === "Operations";

        const calculator = new WeightedScoringCalculator({
          salesData: employeeSalesData,
          auditData: employeeAuditData,
          pointsCalculation: pointsCalcData,
          isOperations,
          minimumDros: 20,
        });

        return {
          ...calculator.metrics,
          Department: department || "Unknown",
        };
      });

      const qualifiedEmployees = summary
        .filter((emp) => emp.Qualified)
        .sort((a, b) => a.WeightedErrorRate - b.WeightedErrorRate);

      const unqualifiedEmployees = summary
        .filter((emp) => !emp.Qualified)
        .sort((a, b) => a.WeightedErrorRate - b.WeightedErrorRate);

      setSummaryData([...qualifiedEmployees, ...unqualifiedEmployees]);
    } catch (error) {
      console.error("Error fetching or calculating summary data:", error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAndCalculateSummary(selectedDate);
    }
  }, [selectedLanid, showAllEmployees, selectedDate, pointsCalculation]);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees") // Replace with your actual table name
        .select("lanid");

      if (error) {
        //console.("Error fetching employees:", error);
      } else {
        setEmployees(data || []);
      }
    };

    fetchEmployees();
  }, []);

  const exportToExcel = (data: SummaryRowData[]) => {
    const exportData = data
      .filter((row) => !row.isDivider)
      .map((row) => ({
        "Sales Rep": row.Lanid,
        "Total DROS": row.TotalDros ?? "",
        "Minor Mistakes": row.MinorMistakes ?? "",
        "Major Mistakes": row.MajorMistakes ?? "",
        "Cancelled DROS": row.CancelledDros ?? "",
        "Weighted Error Rate": row.WeightedErrorRate
          ? `${row.WeightedErrorRate}%`
          : "",
        Status: row.DisqualificationReason,
      }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Contest Results");

    // Get the month and year
    const dateStr = format(selectedDate || new Date(), "MMM_yyyy");

    // Create filename with suffix based on export type
    const suffix = showAllEmployees
      ? "_all_employees"
      : selectedLanid
      ? `_${selectedLanid}`
      : "";

    const fileName = `Sales_Contest_Results_${dateStr}${suffix}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const handleReset = () => {
    setSelectedDate(null);
    setSelectedLanid(null);
    setShowAllEmployees(false);
    setSummaryData([]);
  };

  const updateOptions = (data: DataRow[]) => {
    const salesRepSet = new Set<OptionType>();

    data.forEach((row) => {
      if (row.salesreps) {
        salesRepSet.add({
          value: row.salesreps.trim(),
          label: row.salesreps.trim(),
        });
      }
    });

    setSalesRepOptions(Array.from(salesRepSet));
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date || null);
    fetchAndCalculateSummary(date || null);
  };

  const fetchAuditData = useCallback(async () => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .select("*")
      .order("audit_date", { ascending: false });

    if (error) {
      //console.("Error fetching initial data:", error.message);
      throw new Error(error.message);
    }
    return new Map(data.map((item) => [item.audits_id, item]));
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedData = await fetchAuditData();
      setDataMap(fetchedData);
    } catch (error) {
      //console.("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchAuditData]);

  const columns = useMemo(() => createColumns(refreshData), [refreshData]);

  useEffect(() => {
    refreshData();

    const subscription = supabase
      .channel("Auditsinput_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Auditsinput",
        },
        (payload) => {
          // console.log("Change received!", payload);
          setDataMap((currentMap) => {
            const newMap = new Map(currentMap);
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              newMap.set(payload.new.audits_id, payload.new as AuditData);
            } else if (payload.eventType === "DELETE") {
              newMap.delete(payload.old.audits_id);
            }
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData]);

  const data = useMemo(() => Array.from(dataMap.values()), [dataMap]);

  return (
    <RoleBasedWrapper allowedRoles={["auditor", "admin", "super admin", "dev"]}>
      {loading && <LoadingIndicator />}
      <main className="grid flex-1 items-start my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mb-10 my-8">
          <SupportNavMenu />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center space-x-2">
            <TabsList>
              <TabsTrigger value="submit">Submit Audits</TabsTrigger>
              <TabsTrigger value="review">Review Audits</TabsTrigger>
              <TabsTrigger value="contest">Sales Contest</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="submit">
            <Card>
              <CardContent className="pt-6">
                <SubmitAuditForm onAuditSubmitted={refreshData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <p></p>
                ) : (
                  <LazyDataTable columns={columns as any} data={data as any} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contest">
            <h1 className="text-xl font-bold mb-2 ml-2">
              <TextGenerateEffect words="Monthly Sales" />
            </h1>
            <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Sales Rep</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full">
                    <Select
                      value={selectedLanid || ""}
                      onValueChange={(value) => setSelectedLanid(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <Input
                          placeholder="Search Employee..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="w-full px-3 py-2"
                        />
                        {employees
                          .filter((emp) =>
                            emp.lanid
                              ?.toLowerCase()
                              .includes(searchText.toLowerCase())
                          )
                          .map((emp) => (
                            <SelectItem key={emp.lanid} value={emp.lanid || ""}>
                              {emp.lanid || "Unknown"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      id="show-all"
                      checked={showAllEmployees}
                      onCheckedChange={(checked) => {
                        setShowAllEmployees(checked);
                        if (checked) {
                          setSelectedLanid(null); // Clear the selected employee when switching to show all
                        }
                      }}
                    />
                    <Label htmlFor="show-all">
                      {showAllEmployees
                        ? "Showing All Employees"
                        : "Showing Selected Employee"}
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-2xl font-bold mb-6">
                    Select A Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CustomCalendar
                        selectedDate={selectedDate ?? new Date()}
                        onDateChange={handleDateChange}
                        disabledDays={() => false}
                      />
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    Reset Selections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleReset}
                    >
                      Clear All Selections
                    </Button>
                    <Button
                      onClick={() =>
                        exportToExcel(
                          showAllEmployees
                            ? [
                                ...summaryData.filter((emp) => emp.Qualified),
                                ...summaryData.filter((emp) => !emp.Qualified),
                              ]
                            : summaryData.filter(
                                (item) => item.Lanid === selectedLanid
                              )
                        )
                      }
                      className="w-full"
                    >
                      Export to Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {!showAllEmployees && selectedLanid && (
                <>
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Total # Of DROS
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Total DROS",
                              accessor: "TotalDros",
                              Cell: ({
                                value,
                              }: {
                                value: any;
                                row: { original: any };
                              }) => <div>{value}</div>,
                            },
                          ]}
                          data={summaryData.filter(
                            (item) => item.Lanid === selectedLanid
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Minor Mistakes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Minor Mistakes",
                              accessor: "MinorMistakes",
                            },
                          ]}
                          data={summaryData.filter(
                            (item) => item.Lanid === selectedLanid
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Major Mistakes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Major Mistakes",
                              accessor: "MajorMistakes",
                            },
                          ]}
                          data={summaryData.filter(
                            (item) => item.Lanid === selectedLanid
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">
                        Error Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="text-left">
                        <DataTableProfile
                          columns={[
                            {
                              Header: "Error Rate",
                              accessor: "WeightedErrorRate",
                              Cell: ({
                                value,
                              }: {
                                value: any;
                                row: { original: any };
                              }) => <div>{value}%</div>,
                            },
                          ]}
                          data={summaryData.filter(
                            (item) => item.Lanid === selectedLanid
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card>
              <CardContent>
                <div className="text-left">
                  <DataTableProfile
                    columns={
                      [
                        {
                          Header: "Sales Rep",
                          accessor: "Lanid",
                          Cell: ({ value, row }) => (
                            <div
                              className={`${
                                !row.original.Qualified
                                  ? "text-gray-400 italic"
                                  : ""
                              }`}
                            >
                              {value}
                            </div>
                          ),
                        },
                        {
                          Header: "Total DROS",
                          accessor: "TotalDros",
                          Cell: ({ value, row }) => (
                            <div
                              className={`${
                                !row.original.Qualified
                                  ? "text-gray-400 italic"
                                  : ""
                              }`}
                            >
                              {value === null ? "" : value}
                            </div>
                          ),
                        },
                        {
                          Header: "Minor Mistakes",
                          accessor: "MinorMistakes",
                          Cell: ({ value, row }) => (
                            <div
                              className={`${
                                !row.original.Qualified
                                  ? "text-gray-400 italic"
                                  : ""
                              }`}
                            >
                              {value === null ? "" : value}
                            </div>
                          ),
                        },
                        {
                          Header: "Major Mistakes",
                          accessor: "MajorMistakes",
                          Cell: ({ value, row }) => (
                            <div
                              className={`${
                                !row.original.Qualified
                                  ? "text-gray-400 italic"
                                  : ""
                              }`}
                            >
                              {value === null ? "" : value}
                            </div>
                          ),
                        },
                        {
                          Header: "Cancelled DROS",
                          accessor: "CancelledDros",
                          Cell: ({ value, row }) => (
                            <div
                              className={`${
                                !row.original.Qualified
                                  ? "text-gray-400 italic"
                                  : ""
                              }`}
                            >
                              {value === null ? "" : value}
                            </div>
                          ),
                        },
                        {
                          Header: "Weighted Error Rate",
                          accessor: "WeightedErrorRate",
                          Cell: ({ value, row }) => (
                            <div
                              className={`${
                                !row.original.Qualified
                                  ? "text-gray-400 italic"
                                  : ""
                              }`}
                            >
                              {row.original.isDivider
                                ? ""
                                : value === null
                                ? ""
                                : `${value}%`}
                            </div>
                          ),
                        },
                        {
                          Header: "Status",
                          accessor: "DisqualificationReason",
                          Cell: ({ row }) => (
                            <div
                              className={`${
                                !row.original.Qualified
                                  ? "text-red-500"
                                  : "text-green-500"
                              }`}
                            >
                              {row.original.DisqualificationReason}
                            </div>
                          ),
                        },
                      ] as ColumnDef[]
                    }
                    data={
                      showAllEmployees
                        ? [
                            ...summaryData.filter((emp) => emp.Qualified),
                            {
                              Lanid: "",
                              TotalDros: null,
                              MinorMistakes: null,
                              MajorMistakes: null,
                              CancelledDros: null,
                              WeightedErrorRate: null,
                              Qualified: false,
                              DisqualificationReason: "",
                              isDivider: true,
                            },
                            ...summaryData.filter((emp) => !emp.Qualified),
                          ]
                        : summaryData.filter(
                            (item) => item.Lanid === selectedLanid
                          )
                    }
                    rowClassName={(row) =>
                      row.original.isDivider ? "bg-muted" : ""
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
}
