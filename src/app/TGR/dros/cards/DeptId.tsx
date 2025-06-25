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
import { HoveredLink, Menu, MenuItem, ProductItem } from '@/components/ui/navbar-menu';

function DeptId({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Law Enforcement Department ID Verification</CardTitle>
          <CardDescription>
            <span className="text-red-500">
              Check For Validity Dates & P.C. 832 | &quot;Sworn Officer&quot; Typically Located On
              The Back Of The Department ID Cards
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <h2>Requirements:</h2>
            <ul className="list-disc pl-4">
              <li>
                If The First Name Consists Of Multiple Names On The CA DL | CA ID, Department ID
                Must Match:
              </li>
              <ul className="list-none pl-4">
                <li>- &quot;John Henry&quot;</li>
              </ul>
              <li className="text-amber-500">
                First Name Can Be Shortened ONLY If They Have A Letter From Their Agency Showing
                Simple Statement In Regards To Their Name
              </li>
              <ul className="list-none pl-4">
                <li>- &quot;Nicholas&quot; -&gt; &quot;Nick&quot;</li>
                <ul className="list-none pl-4">
                  <li className="text-amber-500">
                    - Letter Should State That &quot;Nick&quot; Is The Same As &quot;Nicholas&quot;
                  </li>
                </ul>
              </ul>
              <li>
                If The Last Name Consists Of Multiple Names On The CA DL | CA ID, Department ID Must
                Match:
              </li>
              <ul className="list-none pl-4">
                <li>- &quot;Ortiz Monraga&quot;</li>
              </ul>
              <li>
                Middle Names Are Not Always Printed On Department ID&apos;s Therefore It Is Not
                Required
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p>
            We <span className="text-red-500">CANNOT </span>
            Accept Department ID&apos;s If They Don&apos;t Match The Requirements - They Will Have
            To Get A Replacement Department ID
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
export default DeptId;
