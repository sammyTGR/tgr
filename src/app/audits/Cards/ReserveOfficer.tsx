import * as React from "react"
import { useRouter } from "next/router";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";

  
  function ReserveOfficer ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-[515px]" >
            <Card className="flex flex-col w-full">
                <CardHeader>
                <CardTitle>Reserve Officer Info</CardTitle>
                <CardDescription>
                    
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="max-w-full">
                <ul className="list-none pl-4">
                <li>Reserve Officers CAN Purchase Non-Roster Firearms AND They Are FSC Exempt</li>
                <hr className="my-4" />
                <p>FSC Exemption Code</p>
                  <ul className="list-none pl-4">
                  <li>(X34 - PEACE OFFICER - RESERVE)</li>
                  </ul>
                <p>Non-Roster Exemption</p>
                <ul className="list-none pl-4">
                <li>(AGENCY THEY ARE EMPLOYED WITH)</li>
                </ul>
                <hr className="my-4" />
                <p>Reserve Officers Are <span className="text-red-500">NOT</span> 30 Day Exempt</p>
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
  export default ReserveOfficer;