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

function RetiredMilitary({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Retired Military Info</CardTitle>
          <CardDescription>
            <span className="text-orange-500">Before Moving Forward - </span>
            <br />
            <span className="text-orange-500">PRINT</span> THE Federal Doc Worksheet In The Link
            Below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <h2>Required Documents:</h2>
            <ul className="list-none pl-4">
              <p>
                If The Veteran&apos;s DL | ID Doesn&apos;t Indicate VETERAN Status, We Need The
                Following:
              </p>
              <ul className="list-disc pl-4">
                <li>A Copy Of Their DD-214 (Condition Of Discharge)</li>
                <ul className="list-disc pl-4">
                  <li>
                    Remember To Copy | Scan Their DD-214 To Submit For{' '}
                    <span className="text-blue-500">Blue Label</span>
                  </li>
                </ul>
                <li>
                  Write Down DOD ID#, Rank & Branch On Fed Doc Worksheet{' '}
                  <span className="text-orange-500">(Print From Link Below)</span>
                </li>
              </ul>
              <hr className="my-4" />
              <p>FSC Exemption Code</p>
              <ul className="list-none pl-4">
                <li>(X25 - Military - Honorably Retired)</li>
              </ul>
              <hr className="my-4" />
              <p>
                Veterans Are <span className="text-red-500">NOT</span> Non-Roster Exempt
              </p>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink
            href="https://utfs.io/f/9663420d-2204-4991-b7c9-a1e6239e6a3b-n171pw.pdf

"
          >
            <span className="text-orange-500">Federal Doc Worksheet</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default RetiredMilitary;
