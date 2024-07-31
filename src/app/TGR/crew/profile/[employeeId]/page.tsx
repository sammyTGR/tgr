"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/utils/supabase/client";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import SchedulesComponent from "@/components/SchedulesComponent";
import { CalendarIcon } from "lucide-react";
import { CustomCalendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import TimeOffRequestComponent from "@/components/TimeOffRequestComponent";
import { Textarea } from "@/components/ui/textarea";
import { ClockIcon } from "@radix-ui/react-icons";
import { DataTable } from "../../../../admin/audits/contest/data-table";

const schedulestitle = "Scheduling";

// TimeOffReason interface for type
interface TimeOffReason {
  id: number;
  reason: string;
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
  
  interface PointsCalculation {
    category: string;
    error_location: string;
    points_deducted: number;
  }

const EmployeeProfilePage = () => {
  const params = useParams();
  const employeeIdParam = params?.employeeId ?? "";
  const employeeId = Array.isArray(employeeIdParam)
    ? parseInt(employeeIdParam[0], 10)
    : parseInt(employeeIdParam, 10);
  const [employee, setEmployee] = useState<any>(null);
  const [availableTimeOff, setAvailableTimeOff] = useState<number | null>(null);
  const [availableSickTime, setAvailableSickTime] = useState<number | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [pointsCalculation, setPointsCalculation] = useState<PointsCalculation[]>([]);



  // State for time off request
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reason, setReason] = useState<string>("");
  const [showOtherTextarea, setShowOtherTextarea] = useState(false);
  const [otherReason, setOtherReason] = useState<string>("");
  const [timeOffReasons, setTimeOffReasons] = useState<TimeOffReason[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);

  const fetchAvailableSickTime = async () => {
    if (!employeeId) return;
    try {
      const { data, error } = await supabase.rpc(
        "calculate_available_sick_time",
        {
          p_emp_id: employeeId,
        }
      );

      if (error) throw error;

      setAvailableSickTime(data);
    } catch (error) {
      console.error(
        "Error fetching available sick time:",
        (error as Error).message
      );
    }
  };

  const fetchAvailableTimeOff = async () => {
    if (!employeeId) return;
    try {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("sick_time_year, use_sick_time")
        .eq("employee_id", employeeId);

      if (error) throw error;

      // Calculate available time off
      const usedSickTime = data.reduce((acc: number, request: any) => {
        if (request.use_sick_time) {
          acc +=
            (new Date(request.end_date).getTime() -
              new Date(request.start_date).getTime()) /
              (1000 * 60 * 60 * 24) +
            1;
        }
        return acc;
      }, 0);

      setAvailableTimeOff(40 - usedSickTime); // Assuming 40 hours of sick time available at the start of the year
    } catch (error) {
      console.error(
        "Error fetching available time off:",
        (error as Error).message
      );
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchAvailableTimeOff();
    fetchAvailableSickTime();
  }, [employeeId]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date || null);
    fetchAndCalculateSummary(date || null);
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    setShowOtherTextarea(value === "Other" || value === "Swapping Schedules");
  };

  const fetchAndCalculateSummary = async (date: Date | null) => {
    if (!date || !employee) return;

    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    try {
      const { data: salesData, error: salesError } = await supabase
        .from("sales_data")
        .select("*")
        .eq("Lanid", employee.lanid)
        .gte("Date", startDate)
        .lte("Date", endDate)
        .not("subcategory_label", "is", null)
        .not("subcategory_label", "eq", "");

      const { data: auditData, error: auditError } = await supabase
        .from("Auditsinput")
        .select("*")
        .eq("salesreps", employee.lanid)
        .gte("audit_date", startDate)
        .lte("audit_date", endDate);

      if (salesError || auditError) {
        console.error(salesError || auditError);
        return;
      }

      const lanids = [employee.lanid];
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

        employeeSalesData.forEach((sale) => {
          if (sale.dros_cancel === "Yes") {
            pointsDeducted += 5;
          }
        });

        employeeAuditData.forEach((audit) => {
          const auditDate = new Date(audit.audit_date);
          if (auditDate <= date) {
            pointsCalculation.forEach((point) => {
              if (audit.error_location === point.error_location) {
                pointsDeducted += point.points_deducted;
              } else if (
                point.error_location === "dros_cancel_field" &&
                audit.dros_cancel === "Yes"
              ) {
                pointsDeducted += point.points_deducted;
              }
            });
          }
        });

        const totalPoints = 300 - pointsDeducted;

        return {
          Lanid: lanid,
          TotalDros: totalDros,
          PointsDeducted: pointsDeducted,
          TotalPoints: totalPoints,
        };
      });

      summary.sort((a, b) => b.TotalPoints - a.TotalPoints);
      setSummaryData(summary);
    } catch (error) {
      console.error("Error fetching or calculating summary data:", error);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  useEffect(() => {
    if (employee && selectedDate) {
      fetchAndCalculateSummary(selectedDate);
    }
  }, [employee, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedDate || !reason) {
      toast.error("Please select a date and a reason.");
      return;
    }

    const payload = {
      start_date: selectedDate.toISOString().split("T")[0],
      end_date: selectedDate.toISOString().split("T")[0], // Assuming end_date is same as start_date for simplicity
      reason,
      other_reason: showOtherTextarea ? otherReason : "",
      employee_id: employeeId,
      name: employee.name,
      email: employee.contact_info, // Include the email from the employee object
      sick_time_year: selectedDate.getFullYear(),
    };

    try {
      const { data, error } = await supabase
        .from("time_off_requests")
        .insert([payload]);

      if (error) {
        throw error;
      }

      // Reset the form fields
      setSelectedDate(null);
      setReason("");
      setOtherReason("");
      setShowOtherTextarea(false);

      toast.success("Time off request submitted successfully!");
    } catch (error) {
      console.error(
        "Failed to submit time off request:",
        (error as Error).message
      );
      toast.error("Failed to submit time off request.");
    }
  };

  const fetchEmployeeData = async () => {
    if (!employeeId) return;
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .single();
    if (error) {
      console.error("Error fetching employee data:", error.message);
    } else {
      setEmployee(data);
    }
  };

  const fetchAudits = async (lanid: string) => {
    const { data, error } = await supabase
      .from("Auditsinput")
      .select("*")
      .eq("salesreps", lanid)
      .order("audit_date", { ascending: false });
  
    if (error) {
      console.error("Error fetching audits:", error);
    } else {
      setAudits(data as Audit[]);
    }
  };

  useEffect(() => {
    if (employee && employee.lanid) {
      fetchAudits(employee.lanid);
    }
  }, [employee]);
  
  

  useEffect(() => {
    const fetchTimeOffReasons = async () => {
      try {
        const { data, error } = await supabase
          .from("time_off_reasons")
          .select("*");
        if (error) throw error;
        setTimeOffReasons(data);
      } catch (error) {
        console.error(
          "Error fetching time off reasons:",
          (error as Error).message
        );
      }
    };

    fetchTimeOffReasons();
  }, []);

  

  if (!employee) return <div>Loading...</div>;

  return (
    <div className="section w-full">
      <Card className="h-full max-w-8xl mx-auto my-12">
        <header className="bg-gray-100 dark:bg-muted px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Avatar>
              <img
                src={employee.avatar_url || "/Banner.png"}
                alt="Employee Avatar"
              />
              <AvatarFallback>{employee.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">Welcome {employee.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {employee.position}
              </p>
            </div>
          </div>
        </header>
        <main className="grid flex-1 items-start mx-auto my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Tabs defaultValue="schedules" className="w-full">
            <TabsList className="border-b border-gray-200 dark:border-gray-700">
              <TabsTrigger value="schedules">Schedules</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="sops">SOPs</TabsTrigger>
            </TabsList>
            <TabsContent value="schedules">
              <h1 className="text-xl font-bold mb-4 ml-2">
                <TextGenerateEffect words={schedulestitle} />
              </h1>
              <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">
                      Request Time Off
                    </CardTitle>
                    {/* <CalendarIcon className="h-4 w-4 text-muted-foreground" /> */}
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
                    <div className="mt-4">
                      <Select value={reason} onValueChange={handleReasonChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOffReasons.map((reason: TimeOffReason) => (
                            <SelectItem key={reason.id} value={reason.reason}>
                              {reason.reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {showOtherTextarea && (
                      <Textarea
                        className="mt-4"
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        placeholder={
                          reason === "Swapping Schedules"
                            ? "Please specify who you are swapping with"
                            : "Please specify your reason"
                        }
                      />
                    )}
                    <Button
                      onClick={handleSubmit}
                      variant="linkHover1"
                      className="mt-4"
                    >
                      Submit Request
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">
                      Available Sick Time
                    </CardTitle>
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-medium">
                      {availableSickTime !== null
                        ? `${availableSickTime} hours`
                        : "Loading..."}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card >
                <CardHeader>
                </CardHeader>
                <CardContent >
                  <SchedulesComponent employeeId={employeeId} />
                </CardContent>
              </Card>
            </TabsContent>

            
            <TabsContent value="performance">
  <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle >Select A Date</CardTitle>
        {/* Add any icons or elements you want here */}
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
        <CardTitle>DROS Total</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-left">
          <DataTable
            columns={[
              { Header: "Total DROS", accessor: "TotalDros" },
              
            ]}
            data={summaryData}
          />
        </div>
      </CardContent>
    </Card>

    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Points Deducted</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-left">
          <DataTable
            columns={[
              
              { Header: "Points Deducted", accessor: "PointsDeducted" },
              
            ]}
            data={summaryData}
          />
        </div>
      </CardContent>
    </Card>

    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Current Points</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-left">
          <DataTable
            columns={[
              
              { Header: "Total Points", accessor: "TotalPoints" },
            ]}
            data={summaryData}
          />
        </div>
      </CardContent>
    </Card>
  </div>

  <div className="p-6 space-y-4">
    <Card>
      <CardContent>
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="py-2 w-36 text-left">DROS #</th>
              {/* <th className="py-2 w-24 text-left">Sales Rep</th> */}
              {/* <th className="py-2 w-24 text-left">Audit Type</th> */}
              <th className="py-2 w-32 text-left">Trans Date</th>
              {/* <th className="py-2 w-32 text-left">Audit Date</th> */}
              <th className="py-2 w-38 text-left">Location</th>
              <th className="py-2 w-58 text-left">Details</th>
              <th className="py-2 w-64 text-left">Notes</th>
              <th className="py-2 w-12 text-left">Cancelled?</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit, index) => (
              <tr key={index} className="border-t">
                <td className="py-2 w-36">{audit.dros_number}</td>
                {/* <td className="py-2 w-24">{audit.salesreps}</td> */}
                {/* <td className="py-2 w-24">{audit.audit_type}</td> */}
                <td className="py-2 w-30">{audit.trans_date}</td>
                {/* <td className="py-2 w-30">{audit.audit_date}</td> */}
                <td className="py-2 w-38">{audit.error_location}</td>
                <td className="py-2 w-58">{audit.error_details}</td>
                <td className="py-2 w-64">{audit.error_notes}</td>
                <td className="py-2 w-12">{audit.dros_cancel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
</TabsContent>




            <TabsContent value="forms">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Forms content will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sops">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Standard Operating Procedures (SOPs)</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p>SOPs for the employee will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </Card>
    </div>
  );
};

export default EmployeeProfilePage;
