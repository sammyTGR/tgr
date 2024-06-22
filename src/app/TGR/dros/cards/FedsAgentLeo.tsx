import * as React from "react";
import { useRouter } from "next/navigation";
import {
  HoveredLink,
  Menu,
  MenuItem,
  ProductItem,
} from "@/components/ui/navbar-menu";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function FedsAgentLeo({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Federal Agent Info</CardTitle>
          <CardDescription>
            <span className="text-amber-500">
              DROS Exemption Support Can Be Found Under &quot;DROS Exemptions
              Guide&quot; Menu
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <h2>
              Federal Agents Are Listed As{" "}
              <span className="text-amber-500">Group 1</span>
            </h2>
            <hr className="my-4" />
            <p>
              Because You <span className="text-red-500">CANNOT</span> Copy
              Federal ID&apos;s,
              <br />
              Make Sure You Print The{" "}
              <span className="text-amber-500">Federal Doc Worksheet</span> In
              The Info Section Below
            </p>
            <hr className="my-4" />
            <p>
              If The Transaction Is For A{" "}
              <span className="text-blue-500">Blue Label</span> Firearm,
            </p>
            Don&apos;t Forget To Fill Out The{" "}
            <span className="text-red-500">Blue Label</span> Form & Include It
            In The Pending Packet
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://utfs.io/f/9663420d-2204-4991-b7c9-a1e6239e6a3b-n171pw.pdf">
            <span className="text-orange-500">Federal Doc Worksheet</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default FedsAgentLeo;
