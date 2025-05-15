import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { HoveredLink, Menu, MenuItem, ProductItem } from '@/components/ui/navbar-menu';

function SecurityGuards({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-[515px]">
      <Card className="flex flex-col w-full">
        <CardHeader>
          <CardTitle>Security Guards DROS Guide</CardTitle>
          <CardDescription>
            This Is A Reference Guide On How To Fill Out Your DROS Exemption Fields For Non Peace |
            Public Officer Security Guards
            <br />
            County Agency Security Officers Only Qualify For{' '}
            <span className="text-blue-500">ON ROSTER Blue Label</span> Firearms Fill Out The{' '}
            <span className="text-blue-500">Blue Label</span> Form & INCLUDE It In Your Pending
            Packet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="" className="w-full">
            <TabsList>
              <TabsTrigger value="account">Security Guards With Departments</TabsTrigger>
              <TabsTrigger value="password">All Other Security Guards</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <div className="flex flex-col w-full">
                <h2>
                  If Their Department ID Is For COUNTY Probation | Correctional | Sheriff&apos;s
                  Office, & If They Are Neither Peace | Public Officer, But Their ID States Security
                  Guard:
                </h2>
                <br />
                <p>FSC Exemption Code</p>
                <ul className="list-none pl-4">
                  <li>(X81 - PEACE OFFICER STANDARDS AND TRAINING (832PC) FIREARMS TRAINING)</li>
                </ul>
                <p>
                  They Must Also Have Their PC 832 Certificate, Along With All Other Standard
                  Supporting Docs
                </p>
                <hr className="my-4" />
                <p>
                  If They Are A Security Guard For A County Agency (Sac County Sheriff, etc.) & They
                  Have A County Agency Department ID Stating &quot;Security Guard&quot; (&quot;Sac
                  County Probation Security Officer&quot;)
                </p>
                <br />
                <ul className="list-none pl-4">
                  <p>FSC Exemption Code</p>
                  <ul className="list-none pl-4">
                    <li>(X81 - PEACE OFFICER STANDARDS AND TRAINING (832PC) FIREARMS TRAINING)</li>
                  </ul>
                  <p>
                    They Must Also Have Their PC 832 Certificate, Along With All Other Standard
                    Supporting Docs
                  </p>
                </ul>
                <hr className="my-4" />
                <p>
                  County Security Officers Are <span className="text-red-500">NOT</span>:
                </p>
                <ul className="list-none pl-4">
                  <li>Non-Roster Exempt</li>
                </ul>
                <p>
                  They ONLY Qualify For <span className="text-blue-500">ON ROSTER Blue Label</span>{' '}
                  Firearms
                </p>
              </div>
              <hr className="my-4" />
            </TabsContent>
            <TabsContent value="password">
              <div className="flex flex-col w-full">
                <h2>
                  For Security Guards With Both Guard Card + Exposed Carry Permit, And Both The
                  Guard Card & Exposed Carry Permits BOTH Have The SAME, Current Physical Address:
                </h2>
                <br />
                <p>FSC Exemption Code</p>
                <ul className="list-none pl-4">
                  <li>(X91 - PARTICULAR AND LIMITED AUTHORITY PEACE OFFICER)</li>
                </ul>
                <hr className="my-4" />
                <p>
                  Security Guards Are <span className="text-red-500">NOT</span>:
                </p>
                <ul className="list-none pl-4">
                  <li>Non-Roster Exempt</li>
                </ul>
                <p>
                  They ONLY Qualify For <span className="text-blue-500">ON ROSTER Blue Label</span>{' '}
                  Firearms
                </p>
              </div>
              <hr className="my-4" />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between"></CardFooter>
      </Card>
    </div>
  );
}
export default SecurityGuards;
