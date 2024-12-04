"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

const WeeklyAgenda = () => {
  const router = useRouter();
  const redirectToMeetings = () => {
    router.push("/admin/meetings");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <h1 className="text-2xl font-bold">This Page Has Been Relocated</h1>
      <div className="flex flex-col items-center gap-2">
        <h2>
          Please use the new Weekly Meetings Page, By Clicking On The Button
          Below:
        </h2>
        <Button variant="outline" onClick={() => redirectToMeetings()}>
          Weekly Meetings
        </Button>
      </div>
    </div>
  );
};

export default WeeklyAgenda;
