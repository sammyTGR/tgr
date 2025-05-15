import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function FedLimits({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Federal Limits Apply</CardTitle>
          <CardDescription>
            <div className="max-w-full">
              The ATF Requires A Valid Photo ID Along With One Other Valid Government-Issued
              Document That Shows The Current Address The Following Are Accepted Documents, And Can
              Be Combined To Meet The Requirements
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <h2>Required Documents:</h2>
            <ul className="list-disc pl-4">
              <li>A Valid Photo DL | ID Containing The Following Info:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Transferee&apos;s Name</li>
                <li>- CURRENT Residence Address</li>
                <li>- Date Of Birth</li>
              </ul>
              <li>A Valid Passport Which Contains The Following Info:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Transferee&apos;s Name</li>
                <li>- Date Of Birth</li>
                <li>- Photograph Of Purchaser</li>
              </ul>
              <li>Vehicle Registration Containing The Following Info:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Current Physical Address</li>
              </ul>
              <li>A Valid Hunting License</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default FedLimits;
