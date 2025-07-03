import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HoveredLink, Menu, MenuItem, ProductItem } from '@/components/ui/navbar-menu';
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

function PeaceOfficerDROS({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Peace Officer DROS Guide</CardTitle>
          <CardDescription>
            Scan The Front AND Rear Of Department ID Card (Including ID Number)
            <br />
            <br />
            If The Transaction Is For A <span className="text-blue-500">Blue Label</span> Firearm,
            Fill Out The <span className="text-blue-500">Blue Label</span> Form & INCLUDE It In Your
            Pending Packet
            <hr className="my-4" />
            <span className="text-red-500">
              We Can NO LONGER Accept 10 Day Wait Exemption Letters For CDCR
            </span>{' '}
            <br />
            This Means <span className="text-blue-500">NO MORE</span> Same-Day Sales For CDCR
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <StyledTabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10 w-full">
              <TabsTrigger
                value="info"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Public Officer
              </TabsTrigger>
              <TabsTrigger
                value="withoutletter"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                W/O 10 Day Exemption
              </TabsTrigger>
              <TabsTrigger
                value="withletter"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Same Day Sale
              </TabsTrigger>
            </StyledTabsList>
            <TabsContent value="info">
              <div className="max-w-full">
                <h2 className="flex justify-center">
                  <span className="text-amber-500">
                    A Quick Breakdown Of Peace vs Public Officers
                  </span>
                </h2>
                <hr className="my-4" />
                <ul className="list-none pl-4">
                  <li>
                    Any County Probation Or Parole Officer ={' '}
                    <span className="text-blue-500">PEACE OFFICER</span>
                  </li>
                  <ul className="list-none pl-4">
                    <li>(PENAL CODE 830.x Found On Rear Of Department ID Card)</li>
                  </ul>
                  <hr className="my-4" />
                  <li>
                    Any County Correctional Officer ={' '}
                    <span className="text-yellow-400">PUBLIC OFFICER</span>
                  </li>
                  <ul className="list-none pl-4">
                    <li>
                      These Officers Are Considered &quot;Particular And Limited Authority Peace
                      Officers&quot;
                    </li>
                    <li>(P.C. 831.x Found On Rear Of Department ID Card)</li>
                  </ul>
                  <hr className="my-4" />
                  <li>You Can Verify Any Other PC Code Variations In The Link Below</li>
                </ul>
              </div>
              <hr className="my-4" />
            </TabsContent>
            <TabsContent value="withoutletter">
              <div className="flex flex-col w-full">
                <h2>
                  <span className="text-amber-500">
                    Start By Selecting &quot;Exempt Handgun Sale&quot;
                  </span>
                </h2>
                <hr className="my-4" />
                <ul className="list-none pl-4">
                  <p>FSC Exemption Code</p>
                  <ul className="list-none pl-4">
                    <li>(X31 - PEACE OFFICER - CALIFORNIA - ACTIVE)</li>
                  </ul>
                  <p>Waiting Period Exemption | 10 Day Wait</p>
                  <ul className="list-none pl-4">
                    <li>(Letter Required Dated Within 30 Days)</li>
                  </ul>
                  <p>Non-Roster Exemption</p>
                  <ul className="list-none pl-4">
                    <li>(AGENCY THEY ARE EMPLOYED WITH)</li>
                  </ul>
                </ul>
              </div>
              <hr className="my-4" />
            </TabsContent>
            <TabsContent value="withletter">
              <div className="flex flex-col w-full">
                <h2>
                  <span className="text-amber-500">
                    Start By Selecting &quot;Peace Officer Non-Roster Handgun Sale (Letter
                    Required)&quot;
                  </span>
                </h2>
                <hr className="my-4" />
                <ul className="list-none pl-4">
                  <p>FSC Exemption Code</p>
                  <ul className="list-none pl-4">
                    <li>(X31 - PEACE OFFICER - CALIFORNIA - ACTIVE)</li>
                  </ul>
                  <p>Waiting Period Exemption | 10 Day Wait</p>
                  <ul className="list-none pl-4">
                    <li>(PEACE OFFICER (LETTER REQUIRED))</li>
                  </ul>
                  <p>Non-Roster Exemption</p>
                  <ul className="list-none pl-4">
                    <li>(AGENCY THEY ARE EMPLOYED WITH)</li>
                  </ul>
                </ul>
              </div>
              <hr className="my-4" />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <a href="https://california.public.law/codes/ca_penal_code_part_2_title_3_chap_4.5">
            <span className="text-orange-500">Penal Codes Defined</span>
          </a>
          <a href="https://oag.ca.gov/firearms/exemptpo">
            <span className="text-orange-500">Agency Group Info</span>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
export default PeaceOfficerDROS;
