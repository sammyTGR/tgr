"use client";
import React, { useState } from "react";
import SalesDataTable from "./sales-data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import Papa, { ParseResult } from "papaparse";
import * as XLSX from "xlsx";
import SalesRangeStackedBarChart from "../charts/SalesRangeStackedBarChart";
import { CustomCalendar } from "@/components/ui/calendar"; // Import CustomCalendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const title = "Sales Report";

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
  ]);

  const subcategoryMap = new Map<string, string>([
    ["170-7", "Standard Ammunition Eligibility Check"],
    ["170-1", "Dros Fee"],
    ["170-16", "DROS Reprocessing Fee (Dealer Sale)"],
    ["170-8", "Basic Ammunition Eligibility Check"],
  ]);

  const handleUpdateLabels = async () => {
    try {
      const batchSize = 1000;
      let offset = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        const { data, error } = await supabase
          .from("sales_data")
          .select("*")
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error("Error fetching sales data:", error);
          return;
        }

        if (data.length === 0) {
          hasMoreData = false;
          break;
        }

        const updatedData = data.map((row: any) => {
          const categoryLabel = categoryMap.get(row.Cat) || "";
          const subcategoryKey = `${row.Cat}-${row.Sub}`;
          const subcategoryLabel = subcategoryMap.get(subcategoryKey) || "";
          const { total_gross, total_net, ...filteredRow } = row; // Exclude generated columns
          return {
            ...filteredRow,
            category_label: categoryLabel,
            subcategory_label: subcategoryLabel,
          };
        });

        const { error: updateError } = await supabase
          .from("sales_data")
          .upsert(updatedData);

        if (updateError) {
          console.error("Error updating labels:", updateError);
          return;
        }

        offset += batchSize;
      }

      toast.success("Labels updated successfully!");
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      const processData = async (data: any[]) => {
        const formattedData = data.map((row: any) => {
          const categoryLabel = categoryMap.get(row.Cat) || "";
          const subcategoryKey = `${row.Cat}-${row.Sub}`;
          const subcategoryLabel = subcategoryMap.get(subcategoryKey) || "";
          const { total_gross, total_net, ...filteredRow } = row; // Exclude generated columns
          return {
            ...filteredRow,
            Date: convertDateFormat(row.Date),
            category_label: categoryLabel,
            subcategory_label: subcategoryLabel,
          };
        });

        const { data: insertedData, error } = await supabase
          .from("sales_data")
          .insert(formattedData);

        if (error) {
          console.error("Error inserting data:", error);
          reject(error);
        } else {
          console.log("Data successfully inserted:", insertedData);
          resolve();
        }
      };

      if (fileExtension === "csv") {
        Papa.parse(file, {
          header: true,
          complete: async (results: ParseResult<any>) => {
            processData(results.data);
          },
          skipEmptyLines: true,
        });
      } else if (fileExtension === "xlsx") {
        const reader = new FileReader();
        reader.onload = async (e) => {
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
            return rowData;
          });

          processData(formattedData);
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error("Unsupported file type"));
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (file) {
      try {
        await handleFileUpload(file);
        await handleUpdateLabels();
        toast.success("File uploaded and processed successfully!");
      } catch (error) {
        toast.error("Failed to upload and process file.");
      }
    } else {
      toast.error("No file selected.");
    }
  };

  const handleRangeChange = (date: Date | undefined) => {
    if (date) {
      setSelectedRange({ start: date, end: date });
    }
  };

  return (
    <RoleBasedWrapper allowedRoles={["admin", "super admin"]}>
      <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.6rem] 2xl:text-[4rem] text-red-500">
        <TextGenerateEffect words={title} />
      </h1>
      <div className="flex max-w-8xl justify-start items-start p-4 mb-4">
        <div className="mr-6 mb-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] pl-3 text-left font-normal"
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
          <h1 className="flex my-2 p-2">Select A Date</h1>
        </div>
        <div className="flex-1 overflow-x-auto max-w-full ml-4 border border-gray-300 rounded-md p-4">
          <SalesRangeStackedBarChart selectedRange={selectedRange} />
        </div>
      </div>
      <div className="flex max-w-6xl w-full justify-start mb-4 px-4 md:px-6">
        <SalesDataTable />
      </div>
      <div className="mt-4">
        <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
        <Button variant="linkHover1" onClick={handleSubmit} className="mt-4">
          Upload and Process
        </Button>
      </div>
    </RoleBasedWrapper>
  );
};

export default SalesPage;
