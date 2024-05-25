// src/app/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import AuditDataTable from "./components/AuditDataTable";
import { AuditData } from "../admin/audits/review/columns"; // Ensure this is the correct path
import fetchData from "../admin/audits/review/fetchData";

const ReviewDashboard: React.FC = () => {
  const [audits, setAudits] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchData()
      .then((data) => {
        setAudits(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Audit Review Dashboard</h1>
      <AuditDataTable data={audits} />
    </div>
  );
};

export default ReviewDashboard;
