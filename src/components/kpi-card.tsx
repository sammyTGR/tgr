import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

interface KPICardProps {
  category: string;
  data: {
    revenue: number;
    qty: number;
    margin?: number;
    soldPrice?: number;
  };
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function KPICard({ category, data }: KPICardProps) {
  const isRangeRental = [
    "Range Targets",
    "PPE",
    "Gun Range Rentals",
    "Station Rentals",
  ].includes(category);

  return (
    <Card className="h-[200px] flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle>{category}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(200px-4rem)]">
          <div className="space-y-4 px-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="text-2xl font-bold">{data.qty}</span>
            </div>
            {isRangeRental ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Net
                  </span>
                  <span className="text-2xl font-bold">
                    {formatter.format(data.margin || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Gross
                  </span>
                  <span className="text-2xl font-bold">
                    {formatter.format(data.soldPrice || 0)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Net</span>
                <span className="text-2xl font-bold">
                  {formatter.format(data.revenue)}
                </span>
              </div>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
