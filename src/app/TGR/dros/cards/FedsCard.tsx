import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoveredLink,
  Menu,
  MenuItem,
  ProductItem,
} from "@/components/ui/navbar-menu";

function FedsCard({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Federal Limits Apply</CardTitle>
          <div className="space-y-1">
            <p>
              If The Purchaser&apos;s VALID CA DL | CA ID States{" "}
              <span className="text-blue-500">
                &quot;Federal Limits Apply&quot;{" "}
              </span>
              In The Top Right Corner, We Need One Of The Docs Below
            </p>
            <p className="text-red-500">
              If There Is A Suffix On One Of The Docs Below, It Must Be Included
              On The DL | ID, Otherwise They Are Required To Get An Interim DL |
              ID To Match
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <h2>Accepted Documents:</h2>
            <ul className="list-disc pl-4">
              <li>Valid, Unexpired U.S. Passport Or Passport Card</li>
              <li>
                Certified Copy Of U.S. Birth Certificate, Or One Of The
                Following, As Long As They Are Issued By The U.S. Department Of
                State:
              </li>
              <ul className="list-none list-inside pl-4">
                <li>- Certification Of Birth Abroad (FS-545)</li>
                <li>- Certification Of Report Of Birth (DS-1350)</li>
                <li>
                  - Consular Report Of Birth Abroad Of A Citizen Of The United
                  States Of America (FS240)
                </li>
              </ul>
              <li>
                Student | Work VISA Holders Must Have All Of The Following:
              </li>
              <ul className="list-none list-inside pl-4">
                <li>- Unexpired Foreign Passport</li>
                <li>- Valid U.S. Immigrant VISA</li>
                <li>- Approved Record Of Arrival|Departure (I-94) Form</li>
              </ul>
              <li>Certified Copy Of Birth Certificate From A U.S. Territory</li>
              <li>Certificate Of Naturalization Or U.S. Citizenship</li>
              <li>Valid, Unexpired Permanent Resident Card</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://oag.ca.gov/firearms/apfaqs#3">
            <span className="text-orange-500">
              CA DOJ FAQ&apos;S (Section 1)
            </span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default FedsCard;
