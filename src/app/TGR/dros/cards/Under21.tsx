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

function Under21({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Under 21 Doc Info</CardTitle>
          <CardDescription>
            <span className="text-purple-500">
              You <span className="text-red-500">MUST</span> PUT THE GO ID# & Expiration Date In The
              DROS Comments Section
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-[425px]">
            <p className="text-red-500 font-bold">DO NOT USE AN FSC Exemption Code</p>
            <ul className="list-none pl-4">
              <li>- Enter FSC Number</li>
            </ul>
            <p className="font-bold">Age Exemption</p>
            <ul className="list-none pl-4">
              <li>- Valid Hunting License</li>
            </ul>
            <hr className="my-4" />
            <h2>Breakdown Of Under 21 Docs That Are Required</h2>
            <ul className="list-disc pl-4">
              <li>Valid CA DL | CA ID</li>
              <li>Valid FSC Card</li>
              <li>Valid Hunting License</li>
            </ul>
            <hr className="my-4" />

            <ul className="list-disc pl-4">
              <li>FSC Card & Hunting License Are BOTH Required, Along With Their CA DL | CA ID</li>
              <li>
                You Are <span className="text-red-500">REQUIRED</span> To Enter The Hunting License
                GO ID # & Expiration Date In The DROS Comment Field
              </li>
            </ul>
            <hr className="my-4" />
            <h2>Long Gun Features For Under 21 Purchases</h2>
            <ul className="list-disc pl-4">
              <li className="text-red-500">Cannot Be A Handgun</li>
              <li className="text-red-500">Cannot Be An FCU</li>
              <li className="text-red-500">Cannot Be A Receiver</li>
              <li className="text-red-500">Cannot Be A Semi-Auto, Center-Fire Rifle</li>
              <li className="text-red-500">Cannot Be A Semi-Auto Rifle If Not .22</li>
              <li>Can Be Semi-Auto Or Pump-Action Shotgun</li>
              <li>Can Be Bolt-Action Rifle</li>
              <li>Can Be Center-Fire Or Rim-Fire .22 Rifle</li>
            </ul>
            <hr className="my-4" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {/* <HoveredLink href="https://utfs.io/f/90bfd4aa-d66a-489f-9b06-565c17bb72f2-elmibi.jpg">
            <span className="text-orange-500">Student VISA Doc Photos</span>
          </HoveredLink> */}
        </CardFooter>
      </Card>
    </div>
  );
}
export default Under21;
