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
  &::-webkit-scrollbar {
    display: none; // Optionally hide the scrollbar
  }
`;

function FederalAgent({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Federal Agent DROS Info</CardTitle>
          <CardDescription>
            <span className="text-amber-500">Before Moving Forward</span>, Ask For A Business Card
            With Agency | Department Letterhead | Seal
            <br />
            And <span className="text-orange-500">PRINT</span> THE Federal Doc Worksheet In The Info
            Section Below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="" className="w-full">
            <StyledTabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10 w-full">
              <TabsTrigger
                value="active"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Federal Active
              </TabsTrigger>
              <TabsTrigger
                value="retired"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Federal Retired
              </TabsTrigger>
            </StyledTabsList>
            <TabsContent value="active">
              <div className="max-w-full">
                <h2>DROS FSC Exemption Fields:</h2>
                <ul className="list-none pl-4">
                  <p>FSC Exemption Code</p>
                  <ul className="list-none pl-4">
                    <li>
                      <p>(X32 - Peace Officer - Federal - Active)</p>
                    </li>
                  </ul>
                  <p>Non-Roster Exemption</p>
                  <ul className="list-none pl-4">
                    <li>(AGENCY THEY ARE EMPLOYED WITH)</li>
                  </ul>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="retired">
              <div className="max-w-full">
                <h2>DROS FSC Exemption Fields:</h2>
                <ul className="list-none pl-4">
                  <p>FSC Exemption Code</p>
                  <ul className="list-none pl-4">
                    <li>(X33 - Peace Officer - Federal - Honorably Retired)</li>
                  </ul>
                  <p>Non-Roster Exemption</p>
                  <ul className="list-none pl-4">
                    <li>(AGENCY THEY WERE EMPLOYED WITH)</li>
                  </ul>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
          <hr className="my-4" />
          <div className="max-w-full">
            <h2>
              Because You <span className="text-red-500">CANNOT</span> Copy Federal ID&apos;s, Print
              & Fill Out Federal Doc Worksheet Along With Scanning The Required Docs Below:
            </h2>
            <ul className="list-disc pl-4">
              <li>A Scan | Copy Of CA DL | CA ID</li>
              <li>A Business Card With Agency | Department Letterhead | Seal</li>
            </ul>
            <br />
            <hr className="my-4" />
            <p>
              If The Transaction Is For A <span className="text-blue-500">Blue Label</span> Firearm,
              <br />
              Don&apos;t Forget To Fill Out The <span className="text-blue-500">
                Blue Label
              </span>{' '}
              Form & Include It In The Pending Packet
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <a href="https://kxxn9fl00i.ufs.sh/f/9jzftpblGSv7ZbsYnqHRcgluo5EN6SiLv0teBVADpY137HQm">
            <span className="text-orange-500">Federal Doc Worksheet</span>
          </a>
          {/* Remove <br/> from here */}
          <a href="https://california.public.law/codes/ca_penal_code_part_2_title_3_chap_4.5">
            <span className="text-orange-500">Penal Codes Defined</span>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
export default FederalAgent;
