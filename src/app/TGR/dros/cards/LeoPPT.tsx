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

function LeoPPT({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Off-Roster LEO PPT&apos;s</CardTitle>
          <CardDescription>
            Check Which Group Their Agency Is BEFORE Starting LEO Off-Roster PPT Transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-full">
            <h2>
              If You Haven&apos;t Already Asked If They Were With A Differenct Agency When They
              Purchased The Firearm,
              <br />
              Do So Now, Before Moving Any Further
            </h2>
            <hr className="my-4" />
            <ul className="list-disc pl-4">
              <li>
                If They Were <span className="text-red-500">NOT</span> Employed By A Different
                Agency, Look Up The Current Agency&apos;s Info From The Agency Group Link Below
              </li>
              <li>
                If They <span className="text-blue-500">WERE</span> Employed With A Different
                Agency, Reference <span className="text-amber-500">THAT</span> Agency&apos;s Group
                Info, Not The Current Agency&apos;s Group Info
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <HoveredLink href="https://oag.ca.gov/firearms/exemptpo">
            <span className="text-orange-500">Agency Group Info</span>
          </HoveredLink>
        </CardFooter>
      </Card>
    </div>
  );
}
export default LeoPPT;
