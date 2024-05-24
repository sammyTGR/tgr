"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import WithRole from "@/components/withRole"; // Import the HOC
import UserSessionHandler from "@/components/UserSessionHandler"; // Import UserSessionHandler

const ScheduleGeneratorPage = () => {
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerateSchedules = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/generate_schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weeks }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setMessage(result.message);
    } catch (error: any) {
      setMessage(`Failed to generate schedules: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
      <UserSessionHandler /> {/* Include UserSessionHandler */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Generate Schedules</h1>
      </div>
      <div className="mb-4">
        <label
          htmlFor="weeks"
          className="block text-sm font-medium text-gray-700"
        >
          Number of Weeks
        </label>
        <input
          type="number"
          id="weeks"
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          min="1"
        />
      </div>
      <Button
        variant="outline"
        onClick={handleGenerateSchedules}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Schedules"}
      </Button>
      {message && <p className="mt-4 text-center text-lg">{message}</p>}
    </div>
  );
};

// Wrap the page with the WithRole HOC and specify allowed roles and emails
export default function ProtectedScheduleGeneratorPage() {
  return (
    <WithRole
      allowedRoles={["super admin"]}
      allowedEmails={["samlee@thegunrange.biz"]}
    >
      <ScheduleGeneratorPage />
    </WithRole>
  );
}
