import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function ConsignRedemp() {
  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Consignment Redemption DROS Guide</CardTitle>
          <CardDescription>
            <span className="text-red-500">NOTE:</span> This Is Only Utilized In Cases Where We Are{' '}
            <span className="text-purple-500">Returning</span> The Consignment Seller&apos;s Firearm
            Back To Them
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <li>Transaction Type</li>
            <ul className="list-none pl-4">
              <li>Pawn/Consignment Handgun Redemption</li>
            </ul>
            <li>FSC Exemption Code</li>
            <ul className="list-none pl-4">
              <li>(X03 - Return To Owner)</li>
            </ul>
            <hr className="my-4" />
            <p>
              Utilize This FSC Exemption Code For <span className="text-purple-500">ALL</span>{' '}
              Consignment Redemptions
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default ConsignRedemp;
