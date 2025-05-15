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

function ProofDocs({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle style={{ color: '#1583B3' }}>Accepted Proof Of Residence Docs</CardTitle>
          <div className="space-y-1">
            <p className="text-amber-500">
              CA DL | IDs With P.O. Boxes Are <span className="text-red-500">NOT ACCEPTABLE</span>{' '}
              As An Address, Even If It Is A REAL ID.
            </p>
            <p className="text-blue-500">
              All Docs Must Have The Full First & Last Names. (Middle Names & Suffixes Are Not
              Always Printed On Documents)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <p>Customer Must Have A Valid FSC Card OR Valid CA CCW Permit</p>
            <p>AND Any ONE Of The Following Docs Below Will Suffice For A Handgun Purchase:</p>
            <ul className="list-disc pl-4">
              <li>LEO Requirements:</li>
              <ul className="list-none list-inside pl-4">
                <li>- REAL ID With Current Physical Address</li>
                <li>- Current (Non Expired) Department ID</li>
              </ul>
              <li>Valid CA Disabled Person Placard Identification Card</li>
              <ul className="list-none list-inside pl-4">
                <li>- AKA Handicap Placard Registration Card</li>
              </ul>
              <li>
                Valid CA DMV Registration With The Current Physical Address For Any Of The
                Following:
              </li>
              <ul className="list-none list-inside pl-4">
                <li>- Vehicle Registration</li>
                <li>- Boat Registration</li>
                <li>- Motorcycle Registration</li>
                <li>- Off Road Vehicle Registration</li>
              </ul>
              <li>Signed & Dated Lease Agreement For A Duration Of 1 Year</li>

              <li>Property Deed (Meets DOJ State Req)</li>
              <li>Current (Within 90 Days) Utility Bill For Current Physical Address, Such As:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Electric Bill</li>
                <li>- Land Line Phone Bill</li>
                <li>- Cable Bill</li>
                <li>- Garbage Bill</li>
                <li>- Internet Bill</li>
                <li>- Water Bill</li>
              </ul>

              <li>Valid CA CCW Permit</li>
              <li>Valid CA Hunting License</li>
              <li>Valid CA Fishing License (Must Be Valid For 1 Year)</li>
              <li>Current & Valid Guard Card + Exposed Carry Card With Current Physical Address</li>
              <ul className="list-none list-inside pl-4">
                <li>- Both Must Have The Same Address</li>
              </ul>
              <li>Current & Valid CA ID | DL + Retired Peace Officer Department ID</li>
              <li>Current & Valid CA ID | DL + Active Peace Officer Department ID</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default ProofDocs;
