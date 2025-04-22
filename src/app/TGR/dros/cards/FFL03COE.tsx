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

function FFL03COE({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>FFL03 With COE DROS Guide</CardTitle>
          <CardDescription>
            <span className="text-red-500">Don&apos;t Forget:</span>
            <br />
            Enter The FFL 03 & COE License Numbers Along With The Expiration
            Dates In The DROS Comments Field!
            <br />
            <hr className="my-4" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <p>
              Individuals With An FFL 03 & COE License Are{" "}
              <span className="text-red-500">NOT</span> Non-Roster Exempt
            </p>
            <hr className="my-4" />
            <p>FSC Exemption Code</p>
            <ul className="list-none pl-4">
              <li>(X13 - FFL COLLECTOR W/COE CURIO/RELIC TRANSACTION)</li>
            </ul>
            <p>30-Day Restriction Exemption</p>
            <ul className="list-none pl-4">
              <li>(COLLECTOR - 03 FFL - VALID COE)</li>
            </ul>
            <hr className="my-4" />
            <p>
              <span className="text-red-500">
                Don&apos;t Forget! Enter The FFL & COE License Numbers ALONG
                WITH THE EXPIRATION DATES In The DROS Comments Field!
              </span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default FFL03COE;
