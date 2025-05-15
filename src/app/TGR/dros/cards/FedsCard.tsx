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
import { HoveredLink, Menu, MenuItem, ProductItem } from '@/components/ui/navbar-menu';

function FedsCard({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Federal Limits Apply</CardTitle>
          <div className="space-y-1">
            <p>
              When CA DL | CA ID Shows{' '}
              <span className="text-blue-500">&quot;Federal Limits Apply&quot; </span>
              In The Top Right Corner
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <ul className="text-red-500">
              <li>
                If One Of The Docs Below Contains A Suffix, It MUST BE Included On The DL | ID,
                Otherwise They Need To Get An Interim DL | ID With Their Suffix
              </li>
            </ul>
            <ul>
              <li>
                If One Of The Docs Below DOES NOT Contain A Suffix, But The DL | ID Shows A Suffix,
                Process The DROS With According To The Document, Not The DL | ID (Without The
                Suffix)
              </li>
            </ul>
            <ul>
              <li>
                If One Of the Docs Shows A Full Middle Name, But The DL | ID Shows A Middle Initial
                or No Middle Name, We Can Accept It. But All Other Docs (Fishing License, DMV Reg,
                etc.) Must Match The DL | ID
              </li>
            </ul>
            <ul>
              <li>All Other Docs (Fishing License, DMV Reg, etc.) Must Match The DL | ID</li>
            </ul>
            Accepted Documents:
            <ul className="list-disc pl-4">
              <li>Valid, Unexpired U.S. Passport Or Passport Card</li>
              <li>
                Certified Copy Of U.S. Birth Certificate, Or One Of The Following, As Long As They
                Are Issued By The U.S. Department Of State:
              </li>
              <ul className="list-none list-inside pl-4">
                <li>- Certification Of Birth Abroad (FS-545)</li>
                <li>- Certification Of Report Of Birth (DS-1350)</li>
                <li>
                  - Consular Report Of Birth Abroad Of A Citizen Of The United States Of America
                  (FS240)
                </li>
              </ul>
              <li>Student | Work VISA Holders Must Have All Of The Following:</li>
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
            <span className="text-orange-500">CA DOJ FAQ&apos;S (Section 1)</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default FedsCard;
