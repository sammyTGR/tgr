'use client';

import * as React from 'react';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminDashboardContent from '../page';

export default function AdminDashboard() {
  return (
    <RoleBasedWrapper allowedRoles={['admin', 'dev']}>
      <div className="container ml-6 md:ml-6 lg:ml-6 md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-20rem)] py-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Admin Dashboard</CardTitle>
          </CardHeader>
        </Card>
        <AdminDashboardContent />
      </div>
    </RoleBasedWrapper>
  );
}
