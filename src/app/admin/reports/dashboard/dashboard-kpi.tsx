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
          <div className="space-y-8">
            {/* Services Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gunsmithing Card - Always reserve the space */}
                <div>
                  {kpiQuery.data?.["Gunsmithing"] && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Gunsmithing Services</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="gap-4">
                          {kpiQuery.data["Gunsmithing"].variants &&
                            Object.entries(
                              kpiQuery.data["Gunsmithing"].variants
                            ).map(([variant, stats]) => (
                              <div key={variant} className="space-y-2">
                                <h4>{variant}</h4>
                                <div className="flex justify-between">
                                  <span>
                                    Qty: {(stats as { qty: number }).qty}
                                  </span>
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

                {/* Reloaded Ammunition Card - Always reserve the space */}
                <div>
                  {kpiQuery.data?.["Reloads"] && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Reloaded Ammunition</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Total Net
                            </span>
                            <span className="text-2xl font-bold">
                              {formatter.format(
                                kpiQuery.data["Reloads"].revenue
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Quantity
                            </span>
                            <span className="text-2xl font-bold">
                              {kpiQuery.data["Reloads"].qty}
                            </span>
                          </div>
                          {/* Variants */}
                          {kpiQuery.data["Reloads"].variants && (
                            <div className="mt-4 space-y-2">
                              {Object.entries(
                                kpiQuery.data["Reloads"].variants
                              ).map(([variant, stats]) => (
                                <div key={variant} className="text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                      {variant}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>
                                      Qty: {(stats as { qty: number }).qty}
                                    </span>
                                    <span>
                                      {formatter.format(
                                        (stats as { revenue: number }).revenue
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Laser Engraving/Stippling Card - Always reserve the space */}
                <div>
                  {kpiQuery.data?.["Laser Engraving/Stippling"] && (
                    <KPICard
                      category="Laser Engraving/Stippling"
                      data={kpiQuery.data["Laser Engraving/Stippling"]}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Range Rentals Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Range Rentals</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  "Range Targets",
                  "Range Protection Equipment",
                  "Range Station Rental",
                  "Gun Range Rental",
                ].map((category) => (
                  <div key={category}>
                    {kpiQuery.data?.[category] && (
                      <KPICard
                        category={
                          category.startsWith("Range ")
                            ? category.replace("Range ", "")
                            : category.replace("Gun Range ", "Firearms ")
                        }
                        data={kpiQuery.data[category]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Firearms Sold Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Firearms Sold</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {["Pistol", "Receiver", "Revolver", "Rifle", "Shotgun"].map(
                  (category) =>
                    kpiQuery.data?.[category] && (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle>{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Total Net
                              </span>
                              <span className="text-2xl font-bold">
                                {formatter.format(
                                  kpiQuery.data[category].revenue
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Quantity
                              </span>
                              <span className="text-2xl font-bold">
                                {kpiQuery.data[category].qty}
                              </span>
                            </div>
                            {/* Variants */}
                            {kpiQuery.data[category].variants && (
                              <div className="mt-4 space-y-2">
                                {Object.entries(
                                  kpiQuery.data[category].variants
                                ).map(([variant, stats]) => (
                                  <div key={variant} className="text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">
                                        {variant}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>
                                        Qty: {(stats as { qty: number }).qty}
                                      </span>
                                      <span>
                                        {formatter.format(
                                          (stats as { revenue: number }).revenue
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                )}
              </div>
            </div>

            {/* Ammunition Sales Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Ammo Sold</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Reloads", "Factory Ammo"].map(
                  (category) =>
                    kpiQuery.data?.[category] && (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle>{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Total Net
                              </span>
                              <span className="text-2xl font-bold">
                                {formatter.format(
                                  kpiQuery.data[category].revenue
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Quantity
                              </span>
                              <span className="text-2xl font-bold">
                                {kpiQuery.data[category].qty}
                              </span>
                            </div>
                            {/* Variants */}
                            {kpiQuery.data[category].variants && (
                              <div className="mt-4 space-y-2">
                                {Object.entries(
                                  kpiQuery.data[category].variants
                                ).map(([variant, stats]) => (
                                  <div key={variant} className="text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">
                                        {variant}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>
                                        Qty: {(stats as { qty: number }).qty}
                                      </span>
                                      <span>
                                        {formatter.format(
                                          (stats as { revenue: number }).revenue
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  );
}

export default DashboardKPI;
