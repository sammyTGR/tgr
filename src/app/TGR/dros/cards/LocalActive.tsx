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

function LocalActive({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Local Active Duty Info</CardTitle>
          <CardDescription>
            <span className="text-orange-500">Before Moving Forward - </span>
            <br />
            <span className="text-orange-500">PRINT</span> THE Federal Doc Worksheet In The Link
            Below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <StyledTabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10 w-full">
              <TabsTrigger
                value="active"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Local Active Duty
              </TabsTrigger>
              <TabsTrigger
                value="activereserve"
                className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Local Active Reserve
              </TabsTrigger>
            </StyledTabsList>
            <TabsContent value="active">
              <div className="max-w-full">
                <hr className="my-4" />
                <p>FSC Exemption Code</p>
                <ul className="list-none pl-4">
                  <li>
                    <p>(X21 - Military - Active Duty)</p>
                  </li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="activereserve">
              <div className="max-w-full">
                <hr className="my-4" />
                <p>FSC Exemption Code</p>
                <ul className="list-none pl-4">
                  <li>
                    <p>(X22 - Military - Active Reserve)</p>
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
          <hr className="my-4" />
          <h2>Required Documents:</h2>
          <ul className="list-disc pl-4">
            <li>Photo Copy | Scan CA DL | CA ID</li>
            <li>Write Down DOD ID#, Rank & Branch</li>
            <li>Proof Of CA Residence (Anything Listed In &quot;Address Correction Docs&quot;)</li>
          </ul>
          <hr className="my-4" />
          Military Are <span className="text-red-500">NOT</span> Roster | 30 Day Exempt
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://kxxn9fl00i.ufs.sh/f/9jzftpblGSv7ZbsYnqHRcgluo5EN6SiLv0teBVADpY137HQm">
            <span className="text-orange-500">Federal Doc Worksheet</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default LocalActive;
