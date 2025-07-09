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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import styled from 'styled-components';

const StyledTabsList = styled(TabsList)`
  display: flex;
  flex-wrap: nowrap; // Prevent wrapping of tabs
  overflow-x: auto; // Allow horizontal scrolling
  -webkit-overflow-scrolling: touch; // Smooth scrolling on touch devices
  // border-bottom: 1px solid #ccc; // Optional: adds a line under your tabs
  &::-webkit-scrollbar {
    display: none; // Optionally hide the scrollbar
  }
`;

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
              All Government-Issued Docs Must Have The Full First & Last Names. (Middle Names &
              Suffixes Are Not Always Printed On Documents)
            </p>
            <p className="text-amber-500">
              Exception: Utility Bills Are Acceptable Without Middle Name Or Suffix.
            </p>
            <p>
              In Addition To A Valid CA DL | ID, Any ONE Of The Following Docs Below Will Suffice:
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="proof" className="w-full">
            <StyledTabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10 w-full">
              <TabsTrigger
                value="proof"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Proof Of Residency
              </TabsTrigger>
              <TabsTrigger
                value="utility"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Utility Bill
              </TabsTrigger>
              <TabsTrigger
                value="deed"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Property Deed
              </TabsTrigger>
              <TabsTrigger
                value="lease"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Lease
              </TabsTrigger>
            </StyledTabsList>

            {/* Proof Of Residency */}
            <TabsContent value="proof">
              <div className="max-w-full">
                <p>
                  Any Current, Government-Issued (City, County, State Or Federal) License, Permit,
                  Or Registration Must Bear Full Name & Current Physical Address, Which Can Be Any
                  Of The Following:
                </p>
                <br />
                <ul className="list-disc pl-4">
                  <li>Hunting License (Must Be Valid For 1 Year)</li>
                  <li>Fishing License (Must Be Valid For 1 Year)</li>
                  <li>Valid CA CCW Permit</li>
                  <li>Valid CA Disabled Person Placard Registration Card</li>
                  <li>Any Valid CA DMV Registration:</li>
                  <ul className="list-dash list-inside pl-4">
                    <li>- Vehicle Registration</li>
                    <li>- Boat Registration</li>
                    <li>- Motorcycle Registration</li>
                    <li>- Off Road Vehicle Registration</li>
                  </ul>
                </ul>
                <ul className="list-disc pl-4">
                  <li>LEO Requirements:</li>
                  <ul className="list-inside list-item pl-4">
                    <li>- Full First & Last Name (Middle Name & Suffix Missing Is Acceptable)</li>
                    <li>
                      - Current (Non Expired) Department ID Show Active, Reserve, Retired, etc.
                    </li>
                  </ul>
                </ul>
              </div>
            </TabsContent>

            {/* Utility Bill */}
            <TabsContent value="utility">
              <div className="max-w-full">
                <p>
                  A Current Statement Of Charges (Within 90 Days) For Providing Direct Service To
                  Physical Residence Must Show Full Name (Middle Name And/Or Suffix Missing Is
                  Acceptable) & Current Physical Address:
                </p>
                <br />
                <ul className="list-disc pl-4">
                  <li>Electric Bill</li>
                  <li>Land Line Phone Bill</li>
                  <li>Cable Bill</li>
                  <li>Garbage Bill</li>
                  <li>Internet Bill</li>
                  <li>Water Bill</li>
                </ul>
              </div>
            </TabsContent>

            {/* Property Deed */}
            <TabsContent value="deed">
              <div className="max-w-full">
                <p>A &quot;Property Deed&quot; Means Either Of The Following:</p>
                <br />
                <ul className="list-disc pl-4">
                  <li>Valid Deed Of Trust That Shows Full Name As Grantee Of Trust</li>
                  <li>
                    Valid Certificate Of Title Issued By A Licensed Title Insurance Company That
                    Shows Full Name As Title Holder To Current Physical Address
                  </li>
                </ul>
              </div>
            </TabsContent>

            {/* Lease */}
            <TabsContent value="lease">
              <div className="max-w-full">
                <p>
                  A &quot;Lease&quot; Must Show Full Name & Current Physical Address & Means Either
                  Of The Following:
                </p>
                <br />
                <ul className="list-disc pl-4">
                  <li>
                    A Signed & Dated Contract Showing Full Name As Lessee Paying A Specified Sum,
                    For A Specified Duration
                  </li>
                  <li>
                    A Signed & Dated Rental Agreement Showing Full Name As Tenant Paying At Fixed
                    Intervals For A Specified Duration
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default ProofDocs;
