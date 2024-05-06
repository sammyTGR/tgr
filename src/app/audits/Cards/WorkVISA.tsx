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


  function WorkVISA ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-full" >
            <Card className="flex flex-col w-full">
                <CardHeader>
                <CardTitle>Work VISA Doc Info</CardTitle>
                <CardDescription>
                <span className="text-purple-500">You <span className="text-red-500">MUST</span> PUT THE GO ID# & Expiration Date In The DROS Comments Section</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-[425px]">
                    <h2>Breakdown Of Work VISA (H1B) Docs That Are Required</h2>
                    <hr className="my-4" />
                    <p>Form I-94:</p>
                    <ul className="list-disc pl-4">
                    <li>DHS Arrival | Departure Record Issued To Travelers Who Are Adjusting Status While In USA, Or Extending Status, Among Other Uses</li>
                    <li>Travelers Must Exit The USA On Or Before Departure Date On Form I-94</li>
                    </ul>
                <hr className="my-4" />
                    <ul className="list-none pl-4">
                    <li>The Form I-94 Is Required Along With Their Work VISA (H1B)</li>
                    <li>You Are <span className="text-red-500">REQUIRED</span> To Enter The Hunting License GO ID # & Expiration Date In The DROS Comment Field</li>
                    </ul>
                <hr className="my-4" />

                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                <HoveredLink href="https://utfs.io/f/bedee236-4c7e-4272-b484-63447fa5bd41-1im1.jpg"><span className="text-orange-500">Work VISA Photo</span></HoveredLink>
                </CardFooter>
            </Card>
        </div>
    )
  }
  export default WorkVISA;