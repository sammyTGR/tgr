'use client';

import SupportNavMenu from '@/components/ui/SupportNavMenu';
import SubmitAuditForm from './form';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';

export default function SubmitAudits() {
  return (
    <RoleBasedWrapper allowedRoles={['user', 'auditor', 'admin', 'super admin', 'dev', 'ceo']}>
      <main>
        <header>
          <div className="flex flow-row items-center justify-center max w-full mb-40 mt-20">
            <SupportNavMenu />
          </div>
        </header>
        <SubmitAuditForm />
      </main>
    </RoleBasedWrapper>
  );
}
