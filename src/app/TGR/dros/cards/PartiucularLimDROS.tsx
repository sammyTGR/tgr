import * as React from "react"
import { useRouter } from "next/navigation";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";

  
  function ParticularLimDROS ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-[515px]" >
            <Card className="flex flex-col w-full">
                <CardHeader>
                <CardTitle>Particular & Limited Authority DROS Guide</CardTitle>
                <CardDescription>
                DROS Exemption Fields For Particular & Limited Authority
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="max-w-full">
                  <h2>This Would Include County Correctional Officers, Security Guards, etc. (Think Of Purcell & Marcus)</h2>
                  <hr className="my-4" />
                <ul className="list-none pl-4">
                <p>FSC Exemption Code</p>
                  <ul className="list-none pl-4">
                  <li>(X91 - PARTICULAR AND LIMITED AUTHORITY PEACE OFFICER)</li>
                  </ul>
                  <p>30-Day Restriction Exemption</p>
                <ul className="list-none pl-4">
                <li>(PEACE OFFICER - CALIFORNIA - ACTIVE)</li>
                </ul>
                <p>Waiting Period Exemption | 10 Day Wait</p>
                <ul className="list-none pl-4">
                <li>(LETTER REQUIRED DATED WITHIN 30 DAYS)</li>
                </ul>
                <p>Non-Roster Exemption</p>
                <ul className="list-none pl-4">
                <li>(AGENCY THEY ARE EMPLOYED WITH)</li>
                </ul>
                <hr className="my-4" />
                <p>If The Transaction Is For A <span className="text-blue-500">Blue Label</span> Firearm, Fill Out The <span className="text-blue-500">Blue Label</span> Form</p>
                <p>& Include It In The Pending Packet</p>
                </ul>
                </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    
                </CardFooter>
            </Card>
        </div>
    )
  }
  export default ParticularLimDROS;