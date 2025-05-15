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

function PendingResident({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>
            <p>Pending Permanent Residents</p>
            <p>(Submitted Application For Residency)</p>
          </CardTitle>
          <CardDescription>
            We <span className="text-red-500">CANNOT ACCEPT</span> Applications For Permanent
            Residency
            <br />
            We MUST Have The PHYSICAL <span className="text-green-600">GREEN CARD</span> Present To
            Move Forward
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-[425px]">
            <p>
              Permanent Residents Are Granted Their Permanent Resident ID&apos;s, Which Are Referred
              To As A <span className="text-green-600">&quot;Green Card&quot;</span> (Because They
              Are Colored <span className="text-green-600">Green)</span>
            </p>
            <hr className="my-4" />
            <p>
              Applications For Permanent Residency Are <span className="text-red-500">NOT</span>{' '}
              Accepted As Proof Of Residency Docs
            </p>
            <hr className="my-4" />
            <p>
              Until They Can Provide A Physical Green Card, We Cannot Sell Them A Firearm, No Matter
              What The Story Could Be
            </p>
            <p>Until They Can Provide A Physical Green Card,</p>
            <hr className="my-4" />
            <p>
              If A Customer Only Has An EAD | Work Authorization - They Are Still Waiting To Become
              A Permanent Resident
            </p>
            <p>We Cannot Sell Them A Firearm Without Permanent Resident Status</p>
            <p>
              Please Advise Them We Are Excited To Sell Them A Firearm{' '}
              <span className="text-green-600">
                Once They Receive Their Permanent Resident Card
              </span>{' '}
            </p>
            <hr className="my-4" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <a href="https://www.uscis.gov/i-9-central/form-i-9-resources/handbook-for-employers-m-274/130-acceptable-documents-for-verifying-employment-authorization-and-identity/131-list-a-documents-that-establish-identity-and-employment-authorization">
            <span className="text-orange-500">All Immigration Doc Examples</span>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
export default PendingResident;
