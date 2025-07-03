import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function CorrectionDocs() {
  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Accepted Address Correction Docs</CardTitle>
          <div className="space-y-1">
            <p>
              Utilize This List If Their CA DL | CA ID Doesn&apos;t Have Their Current Physical
              Address
            </p>
            <p className="text-blue-500">
              All Docs Must Have The Full First & Last Names, Middle Names & Suffixes Are Not Always
              Printed
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <p>
              Any Current, Government-Issued (City, County, State Or Federal) License, Permit, Or
              Registration Must Bear Full Name & Current Physical Address, Which Can Be Any Of The
              Following:
            </p>
            <br />
            <ul className="list-disc pl-4">
              <li>Hunting License (Must Be Valid For 1 Year)</li>
              <li>Fishing License (Must Be Valid For 1 Year)</li>
              <li>Valid CA CCW Permit</li>
              <li>Valid CA Disabled Person Placard Registration Card</li>
              <li>Any Valid CA DMV Registration:</li>
              <ul className="list-none list-inside pl-4">
                <li>- Vehicle Registration</li>
                <li>- Boat Registration</li>
                <li>- Motorcycle Registration</li>
                <li>- Off Road Vehicle Registration</li>
              </ul>
            </ul>
            <ul className="list-disc pl-4">
              <li>Current & Valid Guard Card + Exposed Carry Card With Current Physical Address</li>
              <ul className="list-none list-inside pl-4">
                <li>- Both Must Have The Same Address</li>
              </ul>
              <li>
                Most Recent Property Tax Bill (Meets Federal Req), With One Of The Following To Meet
                State Requirements:
              </li>
              <ul className="list-none list-inside pl-4">
                <li>- Property Deed Of Trust</li>
                <li>- Property Title Issued By A Licensed Title Insurance Company</li>
                <li>- Current (Within 90 Days) Utility Bill</li>
              </ul>
              <li>
                Most Recent W-2 (Meets Federal Req) + Current (Within 90 Days) Utility Bill (Meets
                State Req)
              </li>
              <ul className="list-none list-inside pl-4">
                <li>- Exception For long guns - no utility bill needed, only needs W-2</li>
                <li>- Cannot Accept W-2s After April 30th</li>
              </ul>
              <li>W2 Exception For LEO - W-2 Along With Department ID And Valid CA ID | DL</li>
              <ul className="list-none list-inside pl-4">
                <li>
                  - Name Format Can Be First Initial, Middle Initial, FULL Last Name If It Is Not
                  Showing Full First Name & Middle Name
                </li>
              </ul>

              <li>Federal Firearms License (FFL 03) - Collector Of Curios and Relics</li>
              <li>The Only Utility Bills For Address Correction Accepted:</li>
              <ul className="list-none list-inside pl-4">
                <li>- City Of Roseville Water Bill</li>
                <li>- Sacramento Consolidated Utilities Bill</li>
              </ul>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default CorrectionDocs;
