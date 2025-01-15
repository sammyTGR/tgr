"use client";

import * as React from "react";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminDashboardContent from "../page";

export default function AdminDashboard() {
  return (
    <RoleBasedWrapper allowedRoles={["admin", "dev"]}>
      <div className="container max-w-[calc(100vw-90px)] py-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              Admin Dashboard
            </CardTitle>
          </CardHeader>
        </Card>
        <AdminDashboardContent />
      </div>
    </RoleBasedWrapper>
  );
}
