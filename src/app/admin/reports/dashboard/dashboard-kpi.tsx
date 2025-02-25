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
import { DateRange } from "react-day-picker";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function DashboardKPI({
  kpiQuery,
  drosCancellationsQuery,
  dateRange,
  setDateRange,
  getDefaultDateRange,
  formatter,
}: any) {
  // Update the initial state to have all cards collapsed by default
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    gunsmithing: false,
    reloads: false,
    "laser-engraving-stippling": false,
    "range-targets": false,
    "range-protection-equipment": false,
    "range-station-rental": false,
    "gun-range-rental": false,
    pistol: false,
    receiver: false,
    revolver: false,
    rifle: false,
    shotgun: false,
    "factory-ammo": false,
    "class-ccw": false,
    "class-basic-handgun": false,
    "class-advanced-handgun": false,
  });

  // Helper function to toggle card expansion
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Card wrapper component
  const ExpandableCard = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedCards[id] ?? false;

    return (
      <Card className={`relative ${isExpanded ? "h-auto" : "h-[200px]"}`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCardExpansion(id)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent
          className={`
            ${
              isExpanded
                ? "h-auto max-h-[500px] overflow-y-auto pr-4"
                : "h-[100px] overflow-y-auto pr-4"
            }
            space-y-2
          `}
        >
          {children}
        </CardContent>
      </Card>
    );
  };

  // Add debug logging for KPI data
  React.useEffect(() => {
    if (kpiQuery.data) {
      // console.log("KPI Query Data:", {
      //   firearms: ["Pistol", "Receiver", "Revolver", "Rifle", "Shotgun"].map(
      //     (category) => ({
      //       category,
      //       data: kpiQuery.data[category],
      //     })
      //   ),
      //   protection: kpiQuery.data["Range Protection Equipment"],
      // });
    }
  }, [kpiQuery.data]);

  // Update the handleDateSelect function
  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) return;

    const { from, to } = range;

    if (from) {
      if (!to) {
        // For single date selection, set start of day and end of day
        const singleDate = new Date(from);
        singleDate.setHours(0, 0, 0, 0);
        const endDate = new Date(from);
        endDate.setHours(23, 59, 59, 999);

        setDateRange({
          from: singleDate,
          to: endDate,
        });
      } else {
        // For date range, ensure we have the full days
        const startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);

        setDateRange({
          from: startDate,
          to: endDate,
        });
      }
    }
  };

  // Define the category groups
  const serviceCategories = [
    "Gunsmithing",
    "Reloads",
    "Laser Engraving/Stippling",
  ];
  const rangeRentalsCategories = [
    "Range Targets",
    "Range Protection Equipment",
    "Range Station Rental",
    "Gun Range Rental",
  ];
  const firearmCategories = [
    "Pistol",
    "Receiver",
    "Revolver",
    "Rifle",
    "Shotgun",
  ];
  const ammoCategories = ["Reloads", "Factory Ammo"];
  const classCategories = ["Classes"];

  // Add this inside the component, before the return statement
  React.useEffect(() => {
    if (kpiQuery.data) {
      // console.log("KPI Data:", {
      //   allCategories: Object.keys(kpiQuery.data),
      //   gunsmithing: kpiQuery.data["Gunsmithing"],
      //   services: serviceCategories.map((cat) => ({
      //     category: cat,
      //     exists: !!kpiQuery.data?.[cat],
      //   })),
      // });
    }
  }, [kpiQuery.data]);

  // Helper function to group classes by type
  const groupClassesByType = (
    variants: Record<string, { qty: number; revenue: number }>
  ) => {
    return Object.entries(variants).reduce(
      (acc, [variant, stats]) => {
        const [classType, studentName] = variant.split(" - ");
        if (!acc[classType]) {
          acc[classType] = {};
        }
        acc[classType][variant] = stats;
        return acc;
      },
      {} as Record<string, Record<string, { qty: number; revenue: number }>>
    );
  };

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
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {dateRange?.from &&
            dateRange?.to &&
            (() => {
              const defaultRange = getDefaultDateRange();
              const isSameRange =
                dateRange.from.getTime() === defaultRange.from.getTime() &&
                dateRange.to.getTime() === defaultRange.to.getTime();

              return !isSameRange ? (
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
          <div>Error loading KPI data: {kpiQuery.error.message}</div>
        ) : (
          <div className="space-y-8">
            {/* Services Section */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Gunsmithing, Laser & Reloading
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {`(${serviceCategories.filter((cat) => kpiQuery.data?.[cat]).length} categories)`}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gunsmithing Card */}
                <div>
                  {kpiQuery.data?.["Gunsmithing"] && (
                    <ExpandableCard
                      id="gunsmithing"
                      title="Gunsmithing Services"
                    >
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
                    </ExpandableCard>
                  )}
                </div>

                {/* Reloaded Ammunition Card */}
                <div>
                  {kpiQuery.data?.["Reloads"] && (
                    <ExpandableCard id="reloads" title="Reloaded Ammunition">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Net
                          </span>
                          <span className="text-2xl font-bold">
                            {formatter.format(kpiQuery.data["Reloads"].revenue)}
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
                                  <span className="font-medium">{variant}</span>
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
                    </ExpandableCard>
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
              <h2 className="text-2xl font-bold">
                Range Rentals
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {`(${rangeRentalsCategories.filter((cat) => kpiQuery.data?.[cat]).length} categories)`}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  "Range Targets",
                  "Range Protection Equipment",
                  "Range Station Rental",
                  "Gun Range Rental",
                ].map((category) => {
                  // Add debug logging for PPE
                  if (
                    category === "Range Protection Equipment" &&
                    kpiQuery.data?.[category]
                  ) {
                    // console.log("PPE Data in UI:", {
                    //   category,
                    //   data: kpiQuery.data[category],
                    //   variants: Object.entries(
                    //     kpiQuery.data[category].variants
                    //   ).map(([variant, stats]) => ({
                    //     variant,
                    //     qty: (stats as { qty: number }).qty,
                    //     revenue: (stats as { revenue: number }).revenue,
                    //   })),
                    // });
                  }

                  return (
                    kpiQuery.data?.[category] && (
                      <ExpandableCard
                        key={category}
                        id={category.toLowerCase().replace(/\s+/g, "-")}
                        title={
                          category === "Range Protection Equipment"
                            ? "PPE"
                            : category.startsWith("Range ")
                              ? category.replace("Range ", "")
                              : category
                        }
                      >
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
                          {/* Variants with debug info */}
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
                      </ExpandableCard>
                    )
                  );
                })}
              </div>
            </div>

            {/* Firearms Sold Section with debug info */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Firearms Sold
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {`(${firearmCategories.filter((cat) => kpiQuery.data?.[cat]).length} categories)`}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {["Pistol", "Receiver", "Revolver", "Rifle", "Shotgun"].map(
                  (category) =>
                    kpiQuery.data?.[category] && (
                      <ExpandableCard
                        key={category}
                        id={category.toLowerCase().replace(/\s+/g, "-")}
                        title={category}
                      >
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
                          {/* Variants with manufacturer info */}
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
                      </ExpandableCard>
                    )
                )}
              </div>
            </div>

            {/* Ammunition Sales Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Ammo Sold
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {`(${ammoCategories.filter((cat) => kpiQuery.data?.[cat]).length} categories)`}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {["Reloads", "Factory Ammo"].map(
                  (category) =>
                    kpiQuery.data?.[category] && (
                      <ExpandableCard
                        key={category}
                        id={category.toLowerCase().replace(/\s+/g, "-")}
                        title={category}
                      >
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
                      </ExpandableCard>
                    )
                )}
              </div>
            </div>

            {/* Add after Ammo Sold section and before Classes section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Cancelled DROS
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {`(${drosCancellationsQuery.data?.qty || 0} total)`}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ExpandableCard id="cancelled-dros" title="DROS Cancellations">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Cancellations
                      </span>
                      <span className="text-2xl font-bold">
                        {drosCancellationsQuery.data?.qty || 0}
                      </span>
                    </div>
                    {/* Variants showing salesrep and date */}
                    {drosCancellationsQuery.data?.variants && (
                      <div className="mt-4 space-y-2">
                        {Object.entries(drosCancellationsQuery.data.variants)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([variant, stats]) => (
                            <div key={variant} className="text-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{variant}</span>
                              </div>
                              <div className="flex justify-between text-muted-foreground">
                                <span>
                                  Qty: {(stats as { qty: number }).qty}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </ExpandableCard>
              </div>
            </div>

            {/* Classes Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Classes
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {`(${Object.keys(groupClassesByType(kpiQuery.data?.["Classes"]?.variants || {})).length} types)`}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {kpiQuery.data?.["Classes"] &&
                  Object.entries(
                    groupClassesByType(kpiQuery.data["Classes"].variants)
                  )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([classType, students]) => (
                      <ExpandableCard
                        key={classType}
                        id={`class-${classType.toLowerCase().replace(/\s+/g, "-")}`}
                        title={classType}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Total Net
                            </span>
                            <span className="text-2xl font-bold">
                              {formatter.format(
                                Object.values(students).reduce(
                                  (sum, stats) => sum + stats.revenue,
                                  0
                                )
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Total Students
                            </span>
                            <span className="text-2xl font-bold">
                              {Object.values(students).reduce(
                                (sum, stats) => sum + stats.qty,
                                0
                              )}
                            </span>
                          </div>
                          {/* Students list */}
                          <div className="mt-4 space-y-2">
                            {Object.entries(students)
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([fullName, stats]) => (
                                <div key={fullName} className="text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">
                                      {fullName.split(" - ")[1]}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Qty: {stats.qty}</span>
                                    <span>
                                      {formatter.format(stats.revenue)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </ExpandableCard>
                    ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </TabsContent>
  );
}

export default DashboardKPI;
