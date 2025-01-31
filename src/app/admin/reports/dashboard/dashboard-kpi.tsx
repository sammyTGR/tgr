import { TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import LoadingIndicator from "@/components/LoadingIndicator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function DashboardKPI({
  kpiQuery,
  dateRange,
  setDateRange,
  getDefaultDateRange,
  formatter,
}: any) {
  return (
    <TabsContent value="sales-kpis">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {dateRange?.from ? (
                  dateRange?.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {dateRange?.from &&
            dateRange?.to &&
            (() => {
              const defaultRange = getDefaultDateRange();
              const isCurrentMonth =
                dateRange.from.getMonth() === defaultRange.from.getMonth() &&
                dateRange.from.getFullYear() ===
                  defaultRange.from.getFullYear() &&
                dateRange.to.getMonth() === defaultRange.to.getMonth() &&
                dateRange.to.getFullYear() === defaultRange.to.getFullYear();

              return !isCurrentMonth ? (
                <Button
                  variant="outline"
                  onClick={() => setDateRange(getDefaultDateRange())}
                >
                  Reset to Current Month
                </Button>
              ) : null;
            })()}
        </div>

        {kpiQuery.isLoading ? (
          <LoadingIndicator />
        ) : kpiQuery.error ? (
          <div>Error loading KPI data</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Gunsmithing related cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Gunsmithing",
                "Gunsmithing Parts",
                "Pistol Optic Zero Fee",
                "Sight In/Function Fee",
              ].map(
                (category) =>
                  kpiQuery.data?.[category] && (
                    <KPICard
                      key={category}
                      category={category}
                      data={kpiQuery.data[category]}
                    />
                  )
              )}
            </div>

            {/* Laser Engraving/Stippling */}
            {kpiQuery.data?.["Laser Engraving/Stippling"] && (
              <KPICard
                category="Laser Engraving/Stippling"
                data={kpiQuery.data["Laser Engraving/Stippling"]}
              />
            )}

            {/* Reloaded Ammunition */}
            {kpiQuery.data?.["Reloaded Ammunition"] && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Reloaded Ammunition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Total Net
                        </span>
                        <span className="text-2xl font-bold">
                          {formatter.format(
                            kpiQuery.data["Reloaded Ammunition"].revenue
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Quantity
                        </span>
                        <span className="text-2xl font-bold">
                          {kpiQuery.data["Reloaded Ammunition"].qty}
                        </span>
                      </div>
                    </div>
                    {kpiQuery.data["Reloaded Ammunition"].variants &&
                      Object.entries(
                        kpiQuery.data["Reloaded Ammunition"].variants
                      ).map(([variant, stats]) => (
                        <div key={variant} className="space-y-2">
                          <h4 className="text-sm font-semibold">{variant}</h4>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Qty: {(stats as { qty: number }).qty}</span>
                            <span>
                              {formatter.format(
                                (stats as { revenue: number }).revenue
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </TabsContent>
  );
}

export default DashboardKPI;
