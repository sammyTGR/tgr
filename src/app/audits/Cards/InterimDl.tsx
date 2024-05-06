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

  
  function InterimDl ({ className }: { className?: string }) {
  const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center w-[515px]" >
            <Card className="flex flex-col w-full">
                <CardHeader>
                <CardTitle>Interim ID&apos;s | DL&apos;s Info</CardTitle>
                <CardDescription>
                Customers Can <span className="text-amber-500">CHOOSE</span> Either  &quot;INTERIM OR TEMPORARY ID | DL&quot; At The DMV
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="max-w-full">
                <h2>We <span className="text-red-500">CANNOT</span> Accept TEMPORARY ID | DL&apos;s</h2>
                <h2>We <span className="text-cyan-500">ONLY</span> Accept &quot;INTERIM ID&apos;s | DL&apos;s&quot;</h2>
                 <ul className="list-disc pl-4">
                    <li>But It Must Be Accompanied By The Old Photo ID | DL</li> 
                    <li>The Old Photo ID <span className="red-text text-darken-3">CANNOT</span> Have A Hole Punched In It</li>
                    <li>The Interim ID | DL <span className="text-blue-500">MUST BE SIGNED</span></li>
                </ul>
                </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    
                </CardFooter>
            </Card>
        </div>
    )
  }
  export default InterimDl;