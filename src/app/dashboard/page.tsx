// pages/ReviewDashboard.tsx
"use client";
import React, { useEffect, useState } from 'react';
import AuditDataTable from '../dashboard/components/AuditDataTable';
import { AuditData } from './utils/types'; // Ensure this is the correct path
import fetchAuditData from './utils/fetchAuditData'; // Adjust the path as necessary

const ReviewDashboard: React.FC = () => {
    const [audits, setAudits] = useState<AuditData[]>([]);

    useEffect(() => {
        fetchAuditData().then(setAudits).catch(console.error);
    }, []);

    return (
        <div>
            <h1>Audit Review Dashboard</h1>
            <AuditDataTable data={audits} />
        </div>
    );
}

export default ReviewDashboard;
