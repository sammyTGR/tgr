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

function EmpAuth({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Employment Authorization Docs (EAD&apos;s)</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-[425px]">
            <p>
              Employment Authorization Documents (EAD) | Work Authorization Docs
              Are NOT Equal To Work VISA&apos;s
            </p>
            <hr className="my-4" />
            <p>
              EAD&apos;s Are An Approval To Work While Awaiting Status Change
              From Asylum Seeker | Refugee To Permanent Resident
            </p>
            <p>
              OR For Student VISA (Or Any Other Dependent VISA) Holders To Work
              Legally, For A Specific Period Of Time
            </p>
            <hr className="my-4" />
            <p>
              If A Customer Only Has An EAD | Work Authorization - They Are
              Still Waiting To Become A Permanent Resident
            </p>
            <p>
              We <span className="text-red-500">CANNOT</span> Sell Them A
              Firearm Without Permanent Resident Status
            </p>
            <p>
              Please Advise Them We Are Excited To Sell Them A Firearm{" "}
              <span className="text-green-600">
                Once They Receive Their Permanent Resident Card
              </span>{" "}
            </p>
            <hr className="my-4" />
            <p className="font-light">
              Note: "Asylum Seekers" & "Asylum Status Approved" Are NOT Equal To
              A Permanent Resident Card - They Must Still Apply & Wait For A
              Green Card To Be Issued
            </p>
            <hr className="my-4" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://www.diffen.com/difference/EAD_vs_H-1B#:~:text=The%20EAD%20is%20designed%20for,bachelor's%20degree%20to%20be%20eligible.">
            <span className="text-orange-500">Work VISA (H1B) vs EAD</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default EmpAuth;
