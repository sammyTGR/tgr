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

function ActiveDuty({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Active Duty Out Of State Info</CardTitle>
          <CardDescription>
            <span className="text-orange-500">Before Moving Forward - </span>
            <br />
            <span className="text-orange-500">PRINT</span> THE Federal Doc Worksheet In The Link
            Below
            <br />
            <hr className="my-4" />
            <br />
            If The Transaction Is For A <span className="text-blue-500">Blue Label</span> Firearm,
            <br />
            Don&apos;t Forget To Fill Out The <span className="text-blue-500">Blue Label</span> Form
            & Include It In The Pending Packet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-[425px]">
            <h2>Required Documents:</h2>
            <ul className="list-disc pl-4">
              <li>PCS Orders Containing Effective Date & Order Number</li>
              <li>
                Proof Of CA Residence (Anything Listed In &quot;Address Correction Docs&quot;)
              </li>
              <li>
                Photo Copy Out Of State DL / ID As Normal
                <ul className="list-none pl-4">
                  <li>
                    Write Down DOD ID#, Rank & Branch On
                    <span className="text-orange-500">
                      {' '}
                      Federal Doc Worksheet
                      <br className="lg:hidden" />
                      <span className="lg:inline"> (Printable Link Below)</span>
                    </span>
                  </li>
                </ul>
              </li>
            </ul>
            <hr className="my-4" />
            <p>FSC Exemption Code</p>
            <p>(X21 - Military - Active Duty)</p>
            <hr className="my-4" />
            <p>
              Military Are <span className="text-red-500">NOT</span> Roster | 30 Day Exempt
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://utfs.io/f/9663420d-2204-4991-b7c9-a1e6239e6a3b-n171pw.pdf">
            <span className="text-orange-500">Federal Doc Worksheet</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default ActiveDuty;
