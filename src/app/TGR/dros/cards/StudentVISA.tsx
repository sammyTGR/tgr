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


  function StudentVISA ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-full" >
            <Card className="flex flex-col w-full">
                <CardHeader>
                <CardTitle>Student VISA Doc Info</CardTitle>
                <CardDescription>
                <span className="text-purple-500">You <span className="text-red-500">MUST</span> PUT THE GO ID# & Expiration Date In The DROS Comments Section</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-[425px]">
                    <h2>Breakdown Of Student VISA Docs That Are Required</h2>
                    <hr className="my-4" />
                    <p>Form I-20 - COE For Non-immigrant Student Status (F-1 | M-1):</p>
                    <ul className="list-disc pl-4">
                    <li>Form I-20 (F-1): For Non-immigrant Students Pursuing Academic Courses</li>
                    <li>Form I-20 (M-1): For Non-immigrant Students Pursuing NON-Academic Or Vocational Courses</li>
                    </ul>
                <hr className="my-4" />
                    
                    <ul className="list-none pl-4">
                    <li>Forms I-20 & I-94 Are BOTH Required, Along With Their Student VISA</li>
                    <li>You Are <span className="text-red-500">REQUIRED</span> To Enter The Hunting License GO ID # & Expiration Date In The DROS Comment Field</li>
                    </ul>
                <hr className="my-4" />

                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                <HoveredLink href="https://utfs.io/f/90bfd4aa-d66a-489f-9b06-565c17bb72f2-elmibi.jpg"><span className="text-orange-500">Student VISA Doc Photos</span></HoveredLink>
                </CardFooter>
            </Card>
        </div>
    )
  }
  export default StudentVISA;