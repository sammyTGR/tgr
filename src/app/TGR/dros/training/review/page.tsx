"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../../components/ui/table";
import { Button } from "../../../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../../components/ui/dialog";
import { supabase } from "../../../../../utils/supabase/client";
import type { FormData as OfficerPptHandgunFormData } from "../officerppthandgun/page";
import type { FormData as OfficerHandgunFormData } from "../officerhandgun/page";

type DealerHandgunSale = {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  street_address: string;
  zip_code: string;
  city: string;
  state: string;
  gender: string;
  hair_color: string;
  eye_color: string;
  height_feet: string;
  height_inches: string;
  weight?: string;
  date_of_birth: string;
  id_type: string;
  id_number: string;
  race: string;
  is_us_citizen: boolean;
  place_of_birth: string;
  phone_number?: string;
  alias_first_name?: string;
  alias_middle_name?: string;
  alias_last_name?: string;
  alias_suffix?: string;
  hsc_fsc_number?: string;
  exemption_code: string;
  eligibility_q1: boolean;
  eligibility_q2: boolean;
  eligibility_q3: boolean;
  eligibility_q4: boolean;
  is_gun_show_transaction: boolean;
  waiting_period_exemption?: string;
  restriction_exemption?: string;
  make: string;
  model: string;
  serial_number: string;
  other_number?: string;
  color: string;
  is_new_gun: boolean;
  firearm_safety_device: string;
  comments?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  transaction_type: string;
  seller_first_name?: string;
  seller_middle_name?: string;
  seller_last_name?: string;
  seller_suffix?: string;
  seller_street_address?: string;
  seller_zip_code?: string;
  seller_city?: string;
  seller_state?: string;
  seller_gender?: string;
  seller_hair_color?: string;
  seller_eye_color?: string;
  seller_height_feet?: string;
  seller_height_inches?: string;
  seller_weight?: string;
  seller_date_of_birth?: string;
  seller_id_type?: string;
  seller_id_number?: string;
  seller_race?: string;
  seller_is_us_citizen?: string;
  seller_place_of_birth?: string;
  seller_phone_number?: string;
  seller_alias_first_name?: string;
  seller_alias_middle_name?: string;
  seller_alias_last_name?: string;
  seller_alias_suffix?: string;
  agency_department?: string;
  non_roster_exemption?: string;
  calibers?: string;
  additional_caliber?: string;
  additional_caliber2?: string;
  additional_caliber3?: string;
  barrel_length?: number;
  unit?: string;
  gun_type?: string;
  category?: string;
  regulated?: string;
  frame_only?: boolean;
};

// Add a type for the transaction type
type TransactionType = {
  title: string;
  table: string;
};

const TRANSACTION_TYPES: { [key: string]: TransactionType } = {
  "dealer-handgun": {
    title: "Dealer Handgun Sale",
    table: "dealer_handgun_sales",
  },
  // Add other transaction types as needed
  "ppt-handgun": {
    title: "Handgun PPT",
    table: "private_handgun_transfers",
  },
  "officer-ppt-handgun": {
    title: "Officer Non-Roster Handgun PPT",
    table: "officer_ppt_handgun_transfers",
  },
  "peace-officer-handgun-sale-letter": {
    title: "Peace Officer Handgun Sale (Letter Required)",
    table: "officer_handgun",
  },
  "exempt-handgun": {
    title: "Exempt Handgun Sale",
    table: "exempt_handgun",
  },
  "consignment-handgun-redemption": {
    title: "Consignment Handgun Redemption",
    table: "consignment_handgun_redemption",
  },
  "curio-handgun": {
    title: "Curio / Relic Handgun Sale",
    table: "curio_handgun",
  },
  "olympic-pistol": {
    title: "Olympic Pistol Sale",
    table: "olympic_pistol",
  },
  "handgun-loan": {
    title: "Handgun Loan",
    table: "handgun_loan",
  },
  "handgun-temporary-storage-return": {
    title: "Handgun Temporary Storage Return",
    table: "handgun_temporary_storage_return",
  },
  "dealer-longgun": {
    title: "Dealer Long Gun Sale",
    table: "dealer_longgun",
  },
  "ppt-longgun": {
    title: "Private Party Long Gun Transfer",
    table: "private_longgun_transfers",
  },
  "consignment-longgun-redemption": {
    title: "Consignment Long Gun Redemption",
    table: "consignment_longgun_redemption",
  },
  "curio-longgun": {
    title: "Curio / Relic Long Gun Sale",
    table: "curio_longgun",
  },
  "longgun-loan": {
    title: "Long Gun Loan",
    table: "longgun_loan",
  },
  "longgun-temporary-storage-return": {
    title: "Long Gun Temporary Storage Return",
    table: "longgun_temporary_storage_return",
  },
  "officer-handgun": {
    title: "Officer Non-Roster Handgun",
    table: "officer_handgun",
  },
};

// Add this query hook at the component level
const useAgencyDepartment = (agencyId: string | undefined) => {
  return useQuery({
    queryKey: ["agencyDepartment", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      const response = await fetch(`/api/fetchAgencyPd?id=${agencyId}`);
      if (!response.ok) throw new Error("Failed to fetch agency");
      return response.json();
    },
    enabled: !!agencyId,
  });
};

const ReviewPage = () => {
  // Fetch all employees with their user_uuid
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch("/api/fetchEmployees?select=name,user_uuid");
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      return response.json();
    },
  });

  // Fetch submissions from both dealer handgun sales and private handgun transfers
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["drosSubmissions"],
    queryFn: async () => {
      // Fetch dealer handgun sales
      const { data: dealerSales, error: dealerError } = await supabase
        .from("dealer_handgun_sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (dealerError) throw dealerError;

      // Fetch private party transfers
      const { data: pptSales, error: pptError } = await supabase
        .from("private_handgun_transfers")
        .select("*")
        .order("created_at", { ascending: false });

      if (pptError) throw pptError;

      // Fetch officer PPT handgun transfers
      const { data: officerPptSales, error: officerPptError } = await supabase
        .from("officer_ppt_handgun_transfers")
        .select("*")
        .order("created_at", { ascending: false });

      if (officerPptError) throw officerPptError;

      // Fetch officer handgun
      const { data: officerHandgun, error: officerHandgunError } =
        await supabase
          .from("officer_handgun")
          .select("*")
          .order("created_at", { ascending: false });

      if (officerHandgunError) throw officerHandgunError;

      // Combine and sort all results
      const allSubmissions = [
        ...(dealerSales || []),
        ...(pptSales || []),
        ...(officerPptSales || []),
        ...(officerHandgun || []),
      ].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allSubmissions;
    },
  });

  // Function to get employee name by user_id
  const getEmployeeName = (userId: string) => {
    if (!employees) return "Unknown";
    const employee = employees.find((emp: any) => emp.user_uuid === userId);
    return employee?.name || "Unknown";
  };

  // Detailed view dialog component
  const DetailedView = ({ submission }: { submission: DealerHandgunSale }) => {
    // Add the agency department query
    const { data: agencyData } = useAgencyDepartment(
      submission.agency_department
    );

    // Add officer handgun specific information
    const renderOfficerHandgunInfo = () => {
      if (submission.transaction_type !== "officer-handgun") return null;

      return (
        <Card>
          <CardHeader>
            <CardTitle>Officer Handgun Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>Caliber:</strong> {submission.calibers}
              {submission.additional_caliber &&
                `, ${submission.additional_caliber}`}
              {submission.additional_caliber2 &&
                `, ${submission.additional_caliber2}`}
              {submission.additional_caliber3 &&
                `, ${submission.additional_caliber3}`}
            </p>
            {submission.barrel_length && (
              <p>
                <strong>Barrel Length:</strong> {submission.barrel_length}{" "}
                {submission.unit}
              </p>
            )}
            <p>
              <strong>Frame Only:</strong>{" "}
              {submission.frame_only ? "Yes" : "No"}
            </p>
            <p>
              <strong>Category:</strong> {submission.category}
            </p>
            <p>
              <strong>Non-Roster Exemption:</strong>{" "}
              {submission.non_roster_exemption}
            </p>
            <p>
              <strong>Agency:</strong> {agencyData?.label || "Loading..."}
            </p>
          </CardContent>
        </Card>
      );
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">View Details</Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {/* Purchaser Information */}
            <Card>
              <CardHeader>
                <CardTitle>Purchaser Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Name:</strong> {submission.first_name}{" "}
                  {submission.middle_name} {submission.last_name}
                </p>
                <p>
                  <strong>Address:</strong> {submission.street_address}
                </p>
                <p>
                  <strong>Location:</strong> {submission.city},{" "}
                  {submission.state} {submission.zip_code}
                </p>
                <p>
                  <strong>Phone:</strong> {submission.phone_number}
                </p>
                <p>
                  <strong>ID Type:</strong> {submission.id_type}
                </p>
                <p>
                  <strong>ID Number:</strong> {submission.id_number}
                </p>
              </CardContent>
            </Card>

            {/* Show Seller Information for PPT and Officer PPT transactions */}
            {(submission.transaction_type === "ppt-handgun" ||
              submission.transaction_type === "officer-ppt-handgun") && (
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Name:</strong> {submission.seller_first_name}{" "}
                    {submission.seller_middle_name}{" "}
                    {submission.seller_last_name} {submission.seller_suffix}
                  </p>
                  <p>
                    <strong>Address:</strong> {submission.seller_street_address}
                  </p>
                  <p>
                    <strong>Location:</strong> {submission.seller_city},{" "}
                    {submission.seller_state} {submission.seller_zip_code}
                  </p>
                  <p>
                    <strong>Phone:</strong> {submission.seller_phone_number}
                  </p>
                  <p>
                    <strong>ID Type:</strong> {submission.seller_id_type}
                  </p>
                  <p>
                    <strong>ID Number:</strong> {submission.seller_id_number}
                  </p>
                  {submission.transaction_type === "officer-ppt-handgun" && (
                    <>
                      <p>
                        <strong>Non-Roster Exemption:</strong>{" "}
                        {submission.non_roster_exemption}
                      </p>
                      <p>
                        <strong>Agency:</strong>{" "}
                        {agencyData?.label || "Loading..."}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Physical Characteristics */}
            <Card>
              <CardHeader>
                <CardTitle>Physical Characteristics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Gender:</strong> {submission.gender}
                </p>
                <p>
                  <strong>Hair Color:</strong> {submission.hair_color}
                </p>
                <p>
                  <strong>Eye Color:</strong> {submission.eye_color}
                </p>
                <p>
                  <strong>Height:</strong> {submission.height_feet}&apos;{" "}
                  {submission.height_inches}&quot;
                </p>
                <p>
                  <strong>Weight:</strong> {submission.weight} lbs
                </p>
                <p>
                  <strong>Date of Birth:</strong> {submission.date_of_birth}
                </p>
                <p>
                  <strong>Race:</strong> {submission.race}
                </p>
              </CardContent>
            </Card>

            {/* Firearm Information */}
            <Card>
              <CardHeader>
                <CardTitle>Firearm Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Make:</strong> {submission.make}
                </p>
                <p>
                  <strong>Model:</strong> {submission.model}
                </p>
                <p>
                  <strong>Serial Number:</strong> {submission.serial_number}
                </p>
                <p>
                  <strong>Color:</strong> {submission.color}
                </p>
                <p>
                  <strong>Condition:</strong>{" "}
                  {submission.is_new_gun ? "New" : "Used"}
                </p>
                <p>
                  <strong>Safety Device:</strong>{" "}
                  {submission.firearm_safety_device}
                </p>
                <p>
                  <strong>Gun Show Transaction:</strong>{" "}
                  {submission.is_gun_show_transaction ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>HSC/FSC Number:</strong> {submission.hsc_fsc_number}
                </p>
                <p>
                  <strong>Exemption Code:</strong> {submission.exemption_code}
                </p>
                <p>
                  <strong>Waiting Period Exemption:</strong>{" "}
                  {submission.waiting_period_exemption}
                </p>
                <p>
                  <strong>Restriction Exemption:</strong>{" "}
                  {submission.restriction_exemption}
                </p>
              </CardContent>
            </Card>

            {/* Eligibility Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Eligibility Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Question 1:</strong>{" "}
                  {submission.eligibility_q1 ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Question 2:</strong>{" "}
                  {submission.eligibility_q2 ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Question 3:</strong>{" "}
                  {submission.eligibility_q3 ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Question 4:</strong>{" "}
                  {submission.eligibility_q4 ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>

            {/* Status Information */}
            <Card>
              <CardHeader>
                <CardTitle>Status Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Status:</strong> {submission.status}
                </p>
                <p>
                  <strong>Submitted:</strong>{" "}
                  {new Date(submission.created_at).toLocaleString()}
                </p>
                {submission.comments && (
                  <p>
                    <strong>Comments:</strong> {submission.comments}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add officer handgun specific information */}
          {renderOfficerHandgunInfo()}
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return <div>Loading submissions...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>DROS Training Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Transaction Type</TableHead>
                <TableHead>Purchaser Info</TableHead>
                <TableHead>Firearm</TableHead>
                {/* <TableHead>Status</TableHead> */}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions?.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getEmployeeName(submission.user_id)}</TableCell>
                  <TableCell>
                    {TRANSACTION_TYPES[submission.transaction_type]?.title}
                  </TableCell>
                  <TableCell>
                    {submission.first_name} {submission.last_name}
                  </TableCell>

                  <TableCell>
                    {submission.make} {submission.model}
                  </TableCell>
                  {/* <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : submission.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {submission.status}
                    </span>
                  </TableCell> */}
                  <TableCell>
                    <DetailedView submission={submission} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewPage;
