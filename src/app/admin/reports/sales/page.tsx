// admin\reports\sales\page.tsx
"use client";
import React, { useState, useEffect, Suspense } from "react";
import SalesDataTable from "./sales-data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import Papa, { ParseResult } from "papaparse";
import * as XLSX from "xlsx";
import SalesRangeStackedBarChart from "../charts/SalesRangeStackedBarChart";
import { CustomCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const title = "Sales Report";

interface ChartData {
  Lanid: string;
  Date: string;
  [key: string]: any;
}

const convertDateFormat = (date: string) => {
  if (!date) return "";
  const [month, day, year] = date.split("/");
  if (!month || !day || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const SalesPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  const [loading, setLoading] = useState(false);
  const [totalGross, setTotalGross] = useState<number>(0);
  const [totalNet, setTotalNet] = useState<number>(0);
  const [totalNetMinusExclusions, setTotalNetMinusExclusions] =
    useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(0);

  const categoryMap = new Map<number, string>([
    [3, "Firearm Accessories"],
    [175, "Station Rental"],
    [4, "Ammunition"],
    [170, "Buyer Fees"],
    [1, "Pistol"],
    [10, "Shotgun"],
    [150, "Gun Range Rental"],
    [8, "Accessories"],
    [6, "Knives & Tools"],
    [131, "Service Labor"],
    [101, "Class"],
    [11, "Revolver"],
    [2, "Rifle"],
    [191, "FFL Transfer Fee"],
    [12, "Consumables"],
    [9, "Receiver"],
    [135, "Shipping"],
    [5, "Clothing"],
    [100, "Shooting Fees"],
    [7, "Hunting Gear"],
    [14, "Storage"],
    [13, "Reloading Supplies"],
    [15, "Less Than Lethal"],
    [16, "Personal Protection Equipment"],
    [17, "Training Tools"],
    [132, "Outside Service Labor"],
    [168, "CA Tax Adjust"],
    [192, "CA Tax Gun Transfer"],
    [102, "Monthly Storage Fee (Per Firearm)"],
    [103, "CA Excise Tax"],
    [104, "CA Excise Tax Adjustment"],
  ]);

  const subcategoryMap = new Map<string, string>([
    ["170-7", "Standard Ammunition Eligibility Check"],
    ["170-1", "Dros Fee"],
    ["170-16", "DROS Reprocessing Fee (Dealer Sale)"],
    ["170-8", "Basic Ammunition Eligibility Check"],
  ]);

  const handleFileUpload = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const keys = jsonData[0] as string[];
          const formattedData = jsonData.slice(1).map((row: any) => {
            const rowData: any = {};
            keys.forEach((key, index) => {
              rowData[key] = row[index];
            });

            const categoryLabel = categoryMap.get(parseInt(rowData.Cat)) || "";
            const subcategoryKey = `${rowData.Cat}-${rowData.Sub}`;
            const subcategoryLabel = subcategoryMap.get(subcategoryKey) || "";

            return {
              ...rowData,
              Date: convertDateFormat(rowData.Date),
              category_label: categoryLabel,
              subcategory_label: subcategoryLabel,
            };
          });

          // Process in smaller batches
          const batchSize = 100;
          let processedCount = 0;
          for (let i = 0; i < formattedData.length; i += batchSize) {
            const batch = formattedData.slice(i, i + batchSize);
            const { data: insertedData, error } = await supabase
              .from("sales_data")
              .upsert(batch);

            if (error) {
              //console.("Error upserting data batch:", error);
              // Continue with the next batch instead of rejecting
            } else {
              processedCount += batch.length;
            }

            // Update progress
            setProgress((processedCount / formattedData.length) * 100);
          }

          // console.log(
          //   `Successfully processed ${processedCount} records out of ${formattedData.length} total records`
          // );
          resolve();
        } catch (error) {
          //console.("Error processing data:", error);
          reject(error);
        }
      };

      reader.onerror = (error) => {
        //console.("Error reading file:", error);
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async () => {
    if (file) {
      setLoading(true);
      setProgress(0);

      try {
        await handleFileUpload(file);

        // Check the current record count
        const { count, error } = await supabase
          .from("sales_data")
          .select("*", { count: "exact", head: true });

        if (error) {
          //console.("Error checking record count:", error);
          toast.error("Failed to verify data upload.");
        } else {
          toast.success(
            `File processed successfully. Current record count: ${count}`
          );
        }

        setFile(null);
        setFileName(null);
        setFileInputKey((prevKey) => prevKey + 1);
      } catch (error) {
        //console.("Error during upload and processing:", error);
        toast.error("Failed to upload and process file.");
      } finally {
        setLoading(false);
        setProgress(100);
      }
    } else {
      toast.error("No file selected.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleRangeChange = async (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      // console.log("Selected date:", formattedDate);
      setSelectedRange({ start: date, end: date });

      // Fetch new data and update totals
      try {
        const data = await fetchData(formattedDate, formattedDate);

        const { totalGross, totalNet, totalNetMinusExclusions } =
          processData(data);

        setTotalGross(totalGross);
        setTotalNet(totalNet);
        setTotalNetMinusExclusions(totalNetMinusExclusions);
      } catch (error) {
        //console.("Error fetching chart data:", error);
      }
    }
  };

  const fetchData = async (startDate: string, endDate: string) => {
    const response = await fetch(
      `/api/fetch-sales-data-by-range?start=${startDate}&end=${endDate}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const processData = (data: any[]) => {
    const processedData: ChartData[] = [];
    const categories: Set<string> = new Set();
    const excludeCategoriesFromChart = [
      "CA Tax Gun Transfer",
      "CA Tax Adjust",
      "CA Excise Tax",
      "CA Excise Tax Adjustment",
    ];
    const excludeCategoriesFromTotalNet = [
      "Pistol",
      "Rifle",
      "Revolver",
      "Shotgun",
      "Receiver",
      ...excludeCategoriesFromChart,
    ];

    let totalGross = 0;
    let totalNetMinusExclusions = 0;
    let totalNet = 0;

    data.forEach((item) => {
      const lanid = item.Lanid;
      const category = item.category_label;
      const grossValue = item.total_gross ?? 0;
      const netValue = item.total_net ?? 0;

      totalGross += grossValue;
      totalNet += netValue;

      if (!excludeCategoriesFromTotalNet.includes(category)) {
        totalNetMinusExclusions += netValue;
      }

      if (!excludeCategoriesFromChart.includes(category)) {
        let existingEntry = processedData.find((d) => d.Lanid === lanid);
        if (!existingEntry) {
          existingEntry = {
            Lanid: lanid,
            Date: item.Date,
            Total: 0,
            TotalMinusExclusions: 0,
          };
          processedData.push(existingEntry);
        }

        existingEntry[category] = grossValue;
        existingEntry.Total += grossValue;
        if (!excludeCategoriesFromTotalNet.includes(category)) {
          existingEntry.TotalMinusExclusions += netValue;
        }
        categories.add(category);
      }
    });

    return {
      processedData,
      categories: Array.from(categories),
      totalGross,
      totalNetMinusExclusions,
      totalNet,
    };
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin", "ceo", "super admin", "dev"]}>
      <h1 className="ml-2 lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.6rem] 2xl:text-[4rem] text-red-500">
        <TextGenerateEffect words={title} />
      </h1>
      <main className="grid flex-1 items-start mx-auto my-4 mb-4 max-w-8xl gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Sales Details</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <div className="grid p-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Select A Date To Review
                    </CardTitle>
                    {/* <CalendarIcon className="h-4 w-4 text-muted-foreground" /> */}
                  </CardHeader>
                  <CardContent>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 w-full pl-3 text-left font-normal"
                        >
                          {selectedRange.start ? (
                            format(selectedRange.start, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CustomCalendar
                          selectedDate={selectedRange.start ?? new Date()}
                          onDateChange={handleRangeChange}
                          disabledDays={() => false}
                        />
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Gross Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalGross.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Net Sales With Firearms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalNet.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Net Sales Without Firearms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalNetMinusExclusions.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Suspense fallback={<div></div>}>
                <CardContent className="flex flex-col border p-4">
                  <SalesRangeStackedBarChart selectedRange={selectedRange} />
                </CardContent>
              </Suspense>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Sales Details</CardTitle>
              </CardHeader>
              <Suspense fallback={<div></div>}>
                <CardContent className="flex flex-col border p-2">
                  <div className="flex max-w-8xl w-full justify-start mb-4  md:px-6">
                    <SalesDataTable
                      startDate={
                        selectedRange.start
                          ? format(selectedRange.start, "yyyy-MM-dd")
                          : undefined
                      }
                      endDate={
                        selectedRange.end
                          ? format(selectedRange.end, "yyyy-MM-dd")
                          : undefined
                      }
                    />
                  </div>
                </CardContent>
              </Suspense>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Upload</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col border p-4">
                <div className="mt-4 rounded-md border max-w-6xl">
                  <div className="flex items-center gap-2 ml-2">
                    <label className="Button flex items-center gap-2 p-2 rounded-md cursor-pointer border border-gray-300 hover:bg-gray-100 dark:font-white dark:hover:bg-gray-500 size-icon">
                      {fileName ? fileName : "Select File"}
                      <Input
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <Button
                      variant="linkHover1"
                      onClick={handleSubmit}
                      className="mt-4"
                      disabled={loading || !file} // Disable button when loading or no file selected
                    >
                      {loading ? "Uploading..." : "Upload and Process"}
                    </Button>
                  </div>
                </div>
                {loading && <Progress value={progress} className="mt-4" />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
};

export default SalesPage;
