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

function DelayedDeliveries({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Delayed Deliveries | Undetermined</CardTitle>
          <CardDescription>
            Follow These Steps To Process A Delayed Delivery & Release Out Of Fastbound
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <h2>Deliverying An Undetermined | Approval After Delay Out Of Fastbound:</h2>
            <br />
            <ul className="list-none pl-4">
              <li>27.a. Keep This Date The Same (Must Match Date In 23)</li>
              <ul className="list-none pl-4">
                <li>
                  - If That Date Doesn’t Work, Remove 3 Days From The Current Date (The Day You Are
                  Disposing The Firearm)
                </li>
              </ul>
              {/* Nested list item */}
              <hr className="my-4" />
              <li>27.b. DROS Number</li>
              <ul className="list-none pl-4">
                <li>
                  In State Of CA, DOJ Submits All NICS FBI Background Checks, We Are To Utilize The
                  Dros Number In Place Of The Nics Number
                </li>
              </ul>
              {/* Nested list item */}
              <hr className="my-4" />
              <li>
                27.c. Only “Delayed” Should Be Marked Here, Do Not Enter A Date For The “Firearms
                May Be Transferred On” Entry Field.
              </li>
              <ul className="list-none pl-4">
                <li>
                  This Question Is Asking For A Date To Be Entered If The “Delayed Delivery” Notice
                  Specifies A Date That We Are Given As The Release Date (This Has Yet To Happen)
                </li>
              </ul>
              {/* Nested list item */}
              <hr className="my-4" />
              <li>27.d. Select “No response was provided within 3 business days”</li>
              <hr className="my-4" />
              <li>32. Enter “DOJ Undetermined, Extended BG Check 30 Days”</li>
              <hr className="my-4" />
              <li>Continue With Normal Process To Complete The 4473</li>
              <li>
                After Saving - Have Customer Recertify, Then Save, Send To Cloud, Continue As Normal
              </li>
            </ul>
            <br />
            <span className="text-red-500">
              REMEMBER TO DISPOSE THE FIREARM AFTER YOU SEND THE 4473 TO THE CLOUD!
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default DelayedDeliveries;
