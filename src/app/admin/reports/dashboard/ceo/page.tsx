'use client';

import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import AdminDashboardContent from '../page';

export default function CeoDashboard() {
  return (
    <RoleBasedWrapper allowedRoles={['ceo', 'super admin', 'dev']}>
      <div className="container ml-6 md:ml-6 lg:ml-6 md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-20rem)] py-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">CEO Dashboard</CardTitle>
          </CardHeader>
        </Card>
        <AdminDashboardContent />
      </div>
    </RoleBasedWrapper>
  );
}
