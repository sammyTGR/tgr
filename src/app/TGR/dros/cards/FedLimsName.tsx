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

  
  function FedLimsName ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-[515px]" >
        <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Federal Limits Apply With Name Change</CardTitle>
          <CardDescription>
            If The CA DL | CA ID States <span className="text-blue-500">&quot;Federal Limits Apply&quot;</span> <span className="text-red-500">AND</span> 
             Their Name Doesn&apos;t Match The Proof Document, We Need One Of The Docs Below
            </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="max-w-full">
        <h2>Required Documents:</h2>
          <ul className="list-disc pl-4">
            <li>An Adoption Document That Contains The Legal Name Of The Applicant As A Result Of The Adoption</li>
            <li>A Name Change Document That Contains The Applicant’s Legal Name Both Before And, As A Result Of, The Name Change</li>
            <li>Married | Divorced:</li>
              <ul className="list-none list-inside pl-4">
                <li>- A Marriage Certificate</li>
                <li>- A Dissolution Of Marriage Document That Contains The Legal Name Of The Applicant As A Result Of The Court Action</li>
              </ul>
            <li>Domestic Partnerships:</li>
              <ul className="list-none list-inside pl-4">
                <li>- A Certificate, Declaration Or Registration Document Verifying The Formation Of A Domestic Partnership</li>
                <li>- A Dissolution Of Domestic Partnership Document That Contains The Legal Name Of The Applicant As A Result Of The Court Action</li>
              </ul>
          </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
        <HoveredLink href="https://oag.ca.gov/firearms/apfaqs#3"><span className="text-orange-500">CA DOJ FAQ&apos;S (Section 2 - If Name Differs...)</span></HoveredLink>
        </CardFooter>
      </Card>
</div>
    )
  }
  export default FedLimsName;