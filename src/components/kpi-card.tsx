import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPICardProps {
  category: string;
  data: {
    revenue: number;
    qty: number;
  };
}

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function KPICard({ category, data }: KPICardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{category}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Net</span>
            <span className="text-2xl font-bold">
              {formatter.format(data.revenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quantity</span>
            <span className="text-2xl font-bold">{data.qty}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
