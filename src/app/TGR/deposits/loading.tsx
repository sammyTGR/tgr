import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Loading() {
  return (
    <main className="relative w-full ml-6 md:ml-6 lg:ml-6 md:w-[calc(100vw-10rem)] lg:w-[calc(100vw-60rem)] h-full overflow-hidden flex-1 transition-all duration-300">
      <Tabs defaultValue="reg1">
        <div className="flex items-center justify-between">
          <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10">
            {Array.from({ length: 5 }).map((_, index) => (
              <TabsTrigger key={index} value={`reg${index + 1}`} disabled>
                <Skeleton className="h-4 w-12" />
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center">
            <Switch disabled />
            <Label className="ml-2">
              <Skeleton className="h-4 w-20" />
            </Label>
          </div>
        </div>

        {Array.from({ length: 5 }).map((_, registerIndex) => (
          <TabsContent key={registerIndex} value={`reg${registerIndex + 1}`}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-32" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col">
                  {/* Denominations */}
                  {Array.from({ length: 14 }).map((_, denominationIndex) => (
                    <div className="flex grid grid-cols-3 mb-1" key={denominationIndex}>
                      <div>
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="col-span-1">
                        <Skeleton className="h-9 w-full" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </div>
                    </div>
                  ))}

                  {/* Total In Drawer */}
                  <div className="grid grid-cols-3 mb-2">
                    <div className="col-span-1 text-left">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="col-span-2 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  </div>

                  {/* Total To Deposit */}
                  <div className="grid grid-cols-3 mb-2">
                    <div className="col-span-2 text-left text-lg font-bold">
                      <Skeleton className="h-5 w-36" />
                    </div>
                    <div className="col-span-1 text-right text-lg font-bold">
                      <Skeleton className="h-5 w-20 ml-auto" />
                    </div>
                  </div>

                  {/* AIM Cash Clearing Total */}
                  <div className="grid grid-cols-6 mb-2">
                    <div className="col-span-2">
                      <Skeleton className="h-9 w-full" />
                    </div>
                    <div className="col-span-2 text-center">
                      <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                  </div>

                  {/* Remaining Balance */}
                  <div className="grid grid-cols-3 mb-2">
                    <div className="col-span-2 text-left">
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="col-span-1 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  </div>

                  {/* Explain Discrepancies */}
                  <div className="col-span-2">
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between items-center w-full">
                  <Button variant="outline" disabled className="mr-4">
                    <Skeleton className="h-4 w-32" />
                  </Button>
                  <Button
                    variant="gooeyRight"
                    disabled
                    className="flex justify-between ml-auto mt-4"
                  >
                    <Skeleton className="h-4 w-24" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}
