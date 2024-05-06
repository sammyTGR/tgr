import * as React from "react"
import { useRouter } from "next/router";
import { Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";
import styled from 'styled-components';


const StyledTabsList = styled(TabsList)`
  display: flex;
  flex-wrap: nowrap; // Prevent wrapping of tabs
  overflow-x: auto; // Allow horizontal scrolling
  -webkit-overflow-scrolling: touch; // Smooth scrolling on touch devices
  border-bottom: 1px solid #ccc; // Optional: adds a line under your tabs
  &::-webkit-scrollbar {
    display: none; // Optionally hide the scrollbar
  }
`;

  
  function AmmoPurchase ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-[515px]" >  
        <Card className="flex flex-col w-full">
            <CardHeader>
            <CardTitle>Ammo Sales Guide</CardTitle>
            <CardDescription>
                Customer Must Have Purchased A Firearm Within The Last 5 Years At Current Physical Address<br/>
                Otherwise, They Must Update Their Address With <span className="text-amber-500">CFARS</span> (Link Below)
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Tabs defaultValue="" className="w-full">
          <TabsList className=" grid grid-cols-2 mb-4">
            <TabsTrigger value="address">Address Correction</TabsTrigger>
            <TabsTrigger value="federal">Federal Limits Apply</TabsTrigger>
            <TabsTrigger value="oos">Out Of State Military (ACTIVE DUTY WITH PCS)</TabsTrigger>
          </TabsList>
          <TabsContent value="address">
          <div className="flex flex-col w-full">
                <h2>If The Address On CA DL | ID Is <span className="text-red-500">NOT</span> Current, One Of The Following Docs Can Be Used For Address Correction:</h2>
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
            <h2 >Customer Must Have One Of The Following Docs:</h2>
            <ul className="list-none pl-4">
            <li>Valid Passport</li>
            <li>Certified Birth Certificate</li>
            </ul>
            <p>These Will Be <span className="text-amber-500">IN ADDITION TO</span> A Valid CA ID | DL</p>
            </div>
            <hr className="my-4" />
            </TabsContent>
          <TabsContent value="oos">
          <div className="flex flex-col w-full">
            <h2>Customer Must Have The Following:</h2>
                    <ul className="list-disc pl-4">
                      <li>PCS Orders Containing Effective Date & Order Number</li>
                      <li>Proof Of CA Residence (Anything Listed In &quot;Address Correction Docs&quot;)</li>
                      </ul>
                      <hr className="my-4" />
                      <p>Photo Copy Out Of State DL | ID As Normal</p>
                      <p>Since We Cannot Photocopy Their Military ID - Write Down DOD ID#, Rank & Branch On <span className="text-orange-500">Federal Worksheet (Link Below)</span> </p>
                      <p><span className="text-red-500">DO NOT USE</span> Any Other Address Other Than What&apos;s Listed On Their ID | DL</p>
                      <hr className="my-4" />
                      <p>If The Customer States They Went To Another Shop & They Utilized A Different Address,
                      Direct The Customer To The CFARS Website To Update Their Address (Link Found Below)
                      <hr className="my-4" />
                      We Must <span className="text-red-500">ALWAYS & ONLY</span> Process Their DROS With The Address On Their ID | DL</p>
            </div>
            </TabsContent>
            <TabsContent value="withletter">
            <div className="flex flex-col w-full">
                <h2><span className="text-amber-500">Start By Selecting &quot;Peace Officer Non-Roster Handgun Sale (Letter Required)&quot;</span></h2>
                <hr className="my-4" />
                <ul className="list-none pl-4">
                    <p>FSC Exemption Code</p>
                        <ul className="list-none pl-4">
                        <li>(X31 - PEACE OFFICER - CALIFORNIA - ACTIVE)</li>
                        </ul>
                        <p>30-Day Restriction Exemption</p>
                        <ul className="list-none pl-4">
                            <li>(PEACE OFFICER - ACTIVE - LETTER REQUIRED)</li>
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
            <a href="https://utfs.io/f/dee78aeb-f225-49a3-b669-f28f475cf6ff-n171pw.pdf"><span className="text-orange-500">Federal Doc Worksheet</span></a>
            <a href="https://cfars.doj.ca.gov/login"><span className="text-orange-500">CFARS</span></a>  

            </CardFooter>
            </Card>
            
        </div>
    )
  }
  export default AmmoPurchase;