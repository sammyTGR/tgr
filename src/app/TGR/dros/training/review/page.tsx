"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/utils/supabase/client";

type DealerHandgunSale = {
  id: string;
  created_at: string;
  user_id: string;
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
};

const ReviewPage = () => {
  // Fetch all submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["dealerHandgunSubmissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealer_handgun_sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DealerHandgunSale[];
    },
  });

  // Detailed view dialog component
  const DetailedView = ({ submission }: { submission: DealerHandgunSale }) => (
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
                <strong>Location:</strong> {submission.city}, {submission.state}{" "}
                {submission.zip_code}
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
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return <div>Loading submissions...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dealer Handgun Sale Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Firearm</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions?.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {submission.first_name} {submission.last_name}
                  </TableCell>
                  <TableCell>
                    {submission.make} {submission.model}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
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
