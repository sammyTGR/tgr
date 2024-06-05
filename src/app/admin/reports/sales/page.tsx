"use client";
import SalesDataTable from "./sales-data-table";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const title = "Sales Report";

const SalesPage = () => {
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

        const updatedData = data.map((row: any) => {
          const categoryLabel = categoryMap.get(row.Cat) || "";
          const subcategoryKey = `${row.Cat}-${row.Sub}`;
          const subcategoryLabel = subcategoryMap.get(subcategoryKey) || "";
          return {
            ...row,
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

      toast.success("Ready To Refresh Page");
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  return (
    <div>
      <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.6rem] 2xl:text-[4rem] text-red-500">
        <TextGenerateEffect words={title} />
      </h1>
      <Button variant="default" className="mb-2" onClick={handleUpdateLabels}>
        Update Labels
      </Button>
      <SalesDataTable />
    </div>
  );
};

export default SalesPage;
