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
import { HoveredLink } from '@/components/ui/navbar-menu';

function Guardians({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle style={{ color: '#1583B3' }}>
            Smith & Wesson American Guardians Discount Program
          </CardTitle>
          <div className="space-y-1">
            <p className="font-bold">
              Specially Priced Firearms For Law Enforcement, Military & First Responders
            </p>
            <p>All American Guardians purchases ship with Night Guard Flashlight</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <p>Customer Must Present Valid Department ID</p>
            <p>Qualifying Departments & Agencies (Must Copy ID Front & Back Of ID):</p>
            <hr className="my-4" />
            <ul className="list-disc pl-4">
              <li>Law Enforcement:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Sworn Law Enforcement Officers</li>
                <ul className="list-none list-inside pl-4">
                  <li>- State, County & City</li>
                  <li>- Federal</li>
                  <ul className="list-none list-inside pl-4">
                    <li>- F.B.I</li>
                    <li>- U.S. Marshals</li>
                    <li>- DEA</li>
                    <li>- DHS</li>
                    <li>- etc.</li>
                  </ul>
                  <li>
                    - Law Enforcement Academy Cadets with Enrollment Documentation from the Academy
                  </li>
                  <li>- Also Includes Retired LE Officers With “Retired” Credentials</li>
                </ul>
                <li>- Corrections Officers, including Parole and Probation Officers</li>
                <li>- LE Academy Cadets</li>
                <li>- State Licensed Armed Security Officers</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Includes City Licensed Security Officers</li>
                </ul>
              </ul>

              <hr className="my-4" />
              <li>Military:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Military Personnel</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Including Reservists & National Guard (w/ ID)</li>
                  <li>- Also Includes Retired Military With “Retired” Credentials</li>
                </ul>
                <li>- Disabled In Any Capacity</li>
                <li>- Honorably Discharged Veterans</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Excluded Contractors & Civilian Employees</li>
                  <li>- DD214 & CADL Required</li>
                </ul>
              </ul>

              <hr className="my-4" />
              <li>Fire:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Firefighters & Rescue Personnel</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Certifications Alone Do Not Qualify</li>
                  <li>- Agency Picture ID - Front & Back</li>
                </ul>
              </ul>

              <hr className="my-4" />
              <li>Judicial:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Court Judges</li>
                <li>- District Attorneys</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Includes Assistant District Attorneys</li>
                  <li>- Includes Deputy District Attorneys</li>
                </ul>
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
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://www.smith-wesson.com/american-guardians">
            <span className="text-blue-500">American Guardians</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default Guardians;
