"use client";
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

interface TimeOffRequest {
    id: number;
    employee_id: number;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    name: string; // Adding the name property
}

export default function ApproveRequestsPage() {
    const [requests, setRequests] = useState<TimeOffRequest[]>([]);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch('/api/pending_requests');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log("Fetched requests:", data); // Log the fetched data
                setRequests(data);
            } catch (error: any) {
                console.error("Failed to fetch requests:", error.message);
            }
        };

        fetchRequests();
    }, []);

    const handleApprove = async (request_id: number) => {
        console.log("Approving request with ID:", request_id);
        await handleRequest(request_id, 'approved');
    };

    const handleDeny = async (request_id: number) => {
        console.log("Denying request with ID:", request_id);
        await handleRequest(request_id, 'denied');
    };

    const handleRequest = async (request_id: number, action: string) => {
        try {
            console.log("Sending request:", { request_id, action });
            const response = await fetch('/api/approve_request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ request_id, action }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Response received:", result);

            // Refresh the requests list after approval/denial
            const updatedRequests = requests.filter(request => request.id !== request_id);
            setRequests(updatedRequests);
        } catch (error: any) {
            console.error("Failed to handle request:", error.message);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
            <h1 className="text-2xl font-bold mb-6">Approve Time Off Requests</h1>
            <div className="space-y-4">
                {requests.map((request) => (
                    <div key={request.id} className="p-4 bg-white dark:bg-gray-950 rounded-lg shadow-md">
                        <div className="flex justify-between">
                            <div>
                                <p className="font-medium">Employee: {request.name}</p>
                                <p>Start Date: {request.start_date}</p>
                                <p>End Date: {request.end_date}</p>
                                <p>Reason: {request.reason}</p>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="outline" onClick={() => handleApprove(request.id)}>Approve</Button>
                                <Button variant="outline" onClick={() => handleDeny(request.id)}>Deny</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
