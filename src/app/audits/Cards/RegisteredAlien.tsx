import * as React from "react"
import { useRouter } from "next/router";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { HoveredLink, Menu, MenuItem, ProductItem } from "@/components/ui/navbar-menu";


  function RegisteredAlien ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-full" >
            <Card className="flex flex-col w-full">
                <CardHeader>
                <CardTitle>Registered Alien Info</CardTitle>
                <CardDescription>
                
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-[425px]">
                    <p>When Someone States That They Are A Registered Alien,
                        It Is Required To Make A Color Copy Of Their Alien Registration ID Card</p>
                        <hr className="my-4" />
                        <p>Alien Registration Numbers Are THE SAME As Their USCIS Number,
                        Which Can Be Found On <span className="text-green-600">Their Permanent Resident Card (AKA Their &quot;Green Card&quot;)</span>
                    </p>
                    <hr className="my-4" />
                    <p>If They Have An Older Version Of The Alien Registration ID Card:</p>
                        <ul className="list-disc pl-4">
                    <li>The Alien Registration Number (AR#) Will Need To Be Entered With A Leading Zero (0)
                    And NOT The Leading Letter (&quot;A&quot;) On Their Card, Like The Current AR#&apos;s Start With</li>
                    <ul className="list-none list-inside pl-4">
                        <li>- Example: &quot;0A12345678&quot;</li>
                    </ul>
                    <li>DES Will <span className="text-red-500">NOT</span> Allow You To Move Forward If You Do Not Apply That Change</li>
                    </ul>
                    <hr className="my-4" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                <HoveredLink href="https://www.boundless.com/immigration-resources/what-is-an-alien-registration-number/"><span className="text-orange-500">Alien Registration Numbers Explained</span></HoveredLink>
                </CardFooter>
            </Card>
        </div>
    )
  }
  export default RegisteredAlien;