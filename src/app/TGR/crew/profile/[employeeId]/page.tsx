"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogClose,
} from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import TimeOffRequestComponent from "@/components/TimeOffRequestComponent";
import { Textarea } from "@/components/ui/textarea";
import { ClockIcon } from "@radix-ui/react-icons";
import { DataTable } from "../../../../admin/audits/contest/data-table";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PointsForm from "@/components/PointsForm";
import PointsComponent from "../../points/page";
import { Label } from "@/components/ui/label";

const schedulestitle = "Scheduling";
const performancetitle = "Individual Performance";
const formtitle = "Your Forms";

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

interface Review {
  id: number;
  employee_id: number;
  review_quarter: string;
  review_year: number;
  overview_performance: string;
  achievements_contributions: string[];
  attendance_reliability: string[];
  quality_work: string[];
  communication_collaboration: string[];
  strengths_accomplishments: string[];
  areas_growth: string[];
  recognition: string[];
  created_by: string;
  created_at: string;
}

interface PointsCalculation {
  category: string;
  error_location: string;
  points_deducted: number;
}

const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

const schema = z.object({
  employee: z.string().nonempty({ message: "Employee name is required" }),
  dros_status: z.string().nonempty({ message: "DROS status is required" }),
  dros_number: z.string().min(2, { message: "DROS Number is required" }),
  invoice_number: z.string().min(2, { message: "Invoice Number is required" }),
  serial_number: z.string().min(2, { message: "Serial Number is required" }),
  start_trans: z
    .string()
    .nonempty({ message: "Start Transaction status is required" }),
  details: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

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
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(
    undefined
  );
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [pointsCalculation, setPointsCalculation] = useState<
    PointsCalculation[]
  >([]);

  // State for time off request
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reason, setReason] = useState<string>("");
  const [showOtherTextarea, setShowOtherTextarea] = useState(false);
  const [otherReason, setOtherReason] = useState<string>("");
  const [timeOffReasons, setTimeOffReasons] = useState<TimeOffReason[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [viewReviewDialog, setViewReviewDialog] = useState(false);

  const handleViewReview = (review: Review) => {
    setCurrentReview(review);
    setViewReviewDialog(true);
  };

  const fetchReviews = async () => {
    if (!employeeId) return;

    const { data, error } = await supabase
      .from("employee_quarterly_reviews")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews(data as Review[]);
    }
  };

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
    fetchReviews();
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
      <Card className="flex flex-col h-full max-w-6xl mx-auto my-12">
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
              <TabsTrigger value="schedules">Scheduling</TabsTrigger>
              <TabsTrigger value="performance">Sales & Audits</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
              <Card>
                <CardHeader></CardHeader>
                <CardContent>
                  <SchedulesComponent employeeId={employeeId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <h1 className="text-xl font-bold mb-2 ml-2">
                <TextGenerateEffect words={performancetitle} />
              </h1>
              <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                <Card className="mt-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">
                      Select A Date
                    </CardTitle>
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
                    <CardTitle className="text-2xl font-bold">
                      Total DROS Processed
                    </CardTitle>
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
                    <CardTitle className="text-2xl font-bold">
                      Points Deducted
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="text-left">
                      <DataTable
                        columns={[
                          {
                            Header: "Points Deducted",
                            accessor: "PointsDeducted",
                          },
                        ]}
                        data={summaryData}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                      Current Points
                    </CardTitle>
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
                          <th className="py-2 w-32 text-left">Location</th>
                          <th className="py-2 w-48 text-left">Details</th>
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
                            <td className="py-2 w-32">
                              {audit.error_location}
                            </td>
                            <td className="py-2 w-48">{audit.error_details}</td>
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
              <h1 className="text-xl font-bold mb-2 ml-2">
                <TextGenerateEffect words={formtitle} />
              </h1>
              <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card className="mt-4">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">
                      Submit Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full text-left font-normal"
                        >
                          Submit Points Form
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <PointsForm /> {/* Render the PointsComponent */}
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <h1 className="text-xl font-bold mb-2 ml-2">
                <TextGenerateEffect words="Your Reviews" />
              </h1>
              <div className="grid p-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="mt-4">
                    <CardHeader className="flex flex-col items-start justify-between space-y-2 pb-2">
                      <CardTitle className="text-2xl font-bold">
                        {review.review_quarter} {review.review_year}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                        - {review.created_by} on{" "}
                        {new Date(review.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Button
                        variant="outline"
                        className="w-full text-left font-normal"
                        onClick={() => handleViewReview(review)}
                      >
                        View Review
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog
                open={viewReviewDialog}
                onOpenChange={setViewReviewDialog}
              >
                <DialogOverlay className="fixed inset-0 z-50" />
                <DialogContent className="fixed inset-0 flex items-center justify-center mb-4 bg-white dark:bg-black z-50 view-review-dialog">
                  <div className="bg-white dark:bg-black p-6 rounded-lg shadow-lg max-w-3xl w-full space-y-4 overflow-y-auto max-h-screen">
                    <DialogTitle className="font-size: 1.35rem font-bold">
                      Employee Review
                    </DialogTitle>
                    <DialogDescription>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="view-label"></Label>
                        <p>{currentReview?.review_quarter}</p>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">Year</Label>
                        <p>{currentReview?.review_year}</p>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">
                          Overview of Performance
                        </Label>
                        <p>{currentReview?.overview_performance}</p>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">
                          Achievements and Contributions
                        </Label>
                        <ul className="list-disc pl-5">
                          {currentReview?.achievements_contributions.map(
                            (achievement, index) => (
                              <li key={index}>{achievement}</li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">
                          Attendance and Reliability
                        </Label>
                        <ul className="list-disc pl-5">
                          {currentReview?.attendance_reliability.map(
                            (attendance, index) => (
                              <li key={index}>{attendance}</li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">
                          Quality of Work
                        </Label>
                        <ul className="list-disc pl-5">
                          {currentReview?.quality_work.map((quality, index) => (
                            <li key={index}>{quality}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">
                          Communication & Collaboration
                        </Label>
                        <ul className="list-disc pl-5">
                          {currentReview?.communication_collaboration.map(
                            (communication, index) => (
                              <li key={index}>{communication}</li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">
                          Strengths & Accomplishments
                        </Label>
                        <ul className="list-disc pl-5">
                          {currentReview?.strengths_accomplishments.map(
                            (strength, index) => (
                              <li key={index}>{strength}</li>
                            )
                          )}
                        </ul>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">
                          Areas for Growth and Development
                        </Label>
                        <ul className="list-disc pl-5">
                          {currentReview?.areas_growth.map((area, index) => (
                            <li key={index}>{area}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid gap-1.5 mb-2">
                        <Label className="text-md font-bold">Recognition</Label>
                        <ul className="list-disc pl-5">
                          {currentReview?.recognition.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-end mt-2 space-x-2">
                        <Button
                          variant="linkHover1"
                          onClick={() => setViewReviewDialog(false)}
                        >
                          Close
                        </Button>
                        {/* <Button
                          variant="linkHover1"
                          onClick={() => window.print()}
                        >
                          Print
                        </Button> */}
                      </div>
                    </DialogDescription>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </main>
      </Card>
    </div>
  );
};

export default EmployeeProfilePage;
