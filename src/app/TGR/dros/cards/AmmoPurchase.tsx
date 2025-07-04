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

function AmmoPurchase({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Ammo Sales Guide</CardTitle>
          <CardDescription>
            Customer Must Have Purchased A Firearm Within The Last 5 Years At Current Physical
            Address
            <br />
            Otherwise, They Must Update Their Address With{' '}
            <span className="text-amber-500">CFARS</span> (Link Below)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="address" className="w-full">
            <div className="max-w-full items-center space-x-2">
              <StyledTabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10">
                <TabsTrigger
                  value="address"
                  className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  Address Correction
                </TabsTrigger>
                <TabsTrigger
                  value="federal"
                  className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  FLA
                </TabsTrigger>
                <TabsTrigger
                  value="oos"
                  className="flex-1 relative py-2 text-sm font-medium text-center items-center whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
                >
                  Active Duty (PCS)
                </TabsTrigger>
              </StyledTabsList>
            </div>
            <TabsContent value="address">
              <div className="flex flex-col w-full">
                <h2>
                  If The Address On CA DL | ID Is <span className="text-red-500">NOT</span> Current,
                  One Of The Following Docs Can Be Used For Address Correction:
                </h2>
                <ul className="list-disc pl-4">
                  <li>Valid CA Hunting License</li>
                  <li>Valid CA Fishing License</li>
                  <li>Utility Bill Dated Within The Last 90 Days</li>
                  <li>Valid CA DMV Registration</li>
                  <li>Valid CA CCW Permit</li>
                  <li>Along With Any Other Doc Listed In &quot;Address Correction Docs&quot;</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="federal">
              <div className="max-w-full">
                <h2>Customer Must Have One Of The Following Docs:</h2>
                <ul className="list-none pl-4">
                  <li>Valid Passport</li>
                  <li>Valid Passport Card</li>
                  <li>Certified Birth Certificate</li>
                </ul>
                <p>
                  These Will Be <span className="text-amber-500">IN ADDITION TO</span> A Valid CA ID
                  | DL
                </p>
              </div>
              <hr className="my-4" />
            </TabsContent>
            <TabsContent value="oos">
              <div className="flex flex-col w-full">
                <h2>Customer Must Have The Following:</h2>
                <ul className="list-disc pl-4">
                  <li>PCS Orders Containing Effective Date & Order Number</li>
                  <li>
                    Proof Of CA Residence (Anything Listed In &quot;Address Correction Docs&quot;)
                  </li>
                </ul>
                <hr className="my-4" />
                <p>Photo Copy Out Of State DL | ID As Normal</p>
                <p>
                  Since We Cannot Photocopy Their Military ID - Write Down DOD ID#, Rank & Branch On{' '}
                  <span className="text-orange-500">Federal Worksheet (Link Below)</span>{' '}
                </p>
                <p>
                  <br />
                  <span className="text-red-500">DO NOT USE</span> Any Other Address Other Than
                  What&apos;s Listed On Their Proof Of Residence Docs (Local Address)
                </p>
                <hr className="my-4" />
                <p>
                  If The Customer States They Went To Another Shop & They Utilized A Different
                  Address, Direct The Customer To The CFARS Website To Update Their Address (Link
                  Found Below)
                  <hr className="my-4" />
                  We Must <span className="text-red-500">ALWAYS & ONLY</span> Process Their DROS
                  With The Address On Their Proof Of Residence Docs (Local Address)
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <a href="https://kxxn9fl00i.ufs.sh/f/9jzftpblGSv7ZbsYnqHRcgluo5EN6SiLv0teBVADpY137HQm">
            <span className="text-orange-500">Federal Doc Worksheet</span>
          </a>
          <a href="https://cfars.doj.ca.gov/login">
            <span className="text-orange-500">CFARS</span>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
export default AmmoPurchase;
