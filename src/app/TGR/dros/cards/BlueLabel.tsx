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
import { HoveredLink } from "@/components/ui/navbar-menu";

function BlueLabel({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle style={{ color: "#1583B3" }}>
            Glock Blue Label Discount Program
          </CardTitle>
          <div className="space-y-1">
            <p className="font-bold">
              Available To Those Eligible Below With Valid Department ID
            </p>
            <p>
              Those Who Qualify Will Receive A Discount On TWO Glock Pistols Per
              Calendar Year
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <p>Customer Must Present Valid Department ID</p>
            <p>
              Qualifying Departments & Agencies (Must Copy ID Front & Back Of
              ID):
            </p>
            <hr className="my-4" />
            <ul className="list-disc pl-4">
              <li>Law Enforcement:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Sworn Law Enforcement Officers With Powers Of Arrest</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Federal, State, County & City</li>
                  <li>
                    - Also Includes Retired LE Officers With “Retired”
                    Credentials
                  </li>
                </ul>
                <li>
                  - Corrections Officers, including Parole and Probation
                  Officers
                </li>
                <li>
                  - LE Academy Cadets With Enrolment Documentation From Academy
                </li>
                <li>- Nationally Recognized Armed Security Officers</li>
                <ul className="list-none list-inside pl-4">
                  <li>
                    - Officer Purchase For Full Time Armed Guards With Valid ID
                  </li>
                  <li>- Includes: Loomis, Garda & G4S</li>
                  <li>- Private Investigators Are NOT Eligible</li>
                </ul>
              </ul>

              <hr className="my-4" />
              <li>Military:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Military Personnel</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Including Reservists & National Guard (w/ ID)</li>
                  <li>
                    - Also Includes Retired Military With “Retired” Credentials
                  </li>
                </ul>
                <li>- Honorably Discharged Veterans</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Excluded Contractors & Civilian Employees</li>
                  <li>- DD214 OR NGB-22 & CADL Required</li>
                </ul>
              </ul>

              <hr className="my-4" />
              <li>Fire:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Firefighters & Volunteer Firefighters</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Certifications Alone Do Not Qualify</li>
                  <li>- Agency Picture ID - Front & Back</li>
                </ul>
              </ul>

              <hr className="my-4" />
              <li>Judicial:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Court Judges</li>
                <li>- Prosecutors</li>
              </ul>

              <hr className="my-4" />
              <li>Medical:</li>
              <ul className="list-none list-inside pl-4">
                <li>- EMT&apos;s & Paramedics</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Certifications Alone Do Not Qualify</li>
                </ul>
              </ul>

              <hr className="my-4" />
              <li>Aviation:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Commercial Pilots</li>
                <li>- Federal Flight Deck Officers</li>
              </ul>

              <hr className="my-4" />
              <li>GSSF Coupon Holder:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Include Original GSSF Coupon With Paperwork</li>
              </ul>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://us.glock.com/en/buy/blue-label-program">
            <span className="text-blue-500">GLOCK BLUE LABEL</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default BlueLabel;
