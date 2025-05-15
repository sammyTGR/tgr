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

function FirstLine({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle style={{ color: '#1583B3' }}>
            Springfield Armory F I R S T L I N E Discount Program
          </CardTitle>
          <div className="space-y-1">
            <p className="font-bold">Exclusive Discounts For Those Who Serve</p>
            <p>All FIRSTLINE handguns ship with THREE magazines</p>
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
                  <li>- Federal, State, County & City</li>
                  <li>- Also Includes Retired LE Officers With “Retired” Credentials</li>
                </ul>
                <li>- Corrections Officers, including Parole and Probation Officers</li>
                <li>- LE Academy Cadets</li>
                <li>- State Licensed Armed Security Officers</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Must Be Employed By A State-Licensed Company</li>
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
                <li>- Honorably Discharged Veterans</li>
                <ul className="list-none list-inside pl-4">
                  <li>- Excluded Contractors & Civilian Employees</li>
                  <li>- DD214 & CADL Required</li>
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
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://www.springfield-armory.com/intel/firstline">
            <span className="text-red-400">F I R S T L I N E</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default FirstLine;
