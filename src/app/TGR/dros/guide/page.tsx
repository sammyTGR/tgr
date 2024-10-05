"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IDsCard from "../cards/IDsCard";
import dynamic from "next/dynamic";
import { supabase } from "../../../../utils/supabase/client"; // Updated import
import FedsCard from "../cards/FedsCard";
import { useRouter } from "next/navigation";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";

type DataRow = string[];
type Data = DataRow[];
const SupportMenu = dynamic(() => import("@/components/ui/SupportNavMenu"), {
  ssr: false,
});

interface DropdownItem {
  product: string;
  type: string;
  availability: string;
  validity: string;
  residency: string;
  address: string;
  document: string;
  blank: string;
  requirements: string;
}

export default function DROSGuide() {
  const [data, setData] = useState<DropdownItem[]>([]);
  const [selections, setSelections] = useState<(string | null)[]>(
    Array(8).fill(null)
  );
  const [activeDialogContentId, setActiveDialogContentId] = useState<
    string | null
  >(null);

  const handleSubItemClick = (contentId: string) => {
    setActiveDialogContentId(contentId);
  };

  const renderDialogContent = () => {
    switch (activeDialogContentId) {
      case "IDsCard":
        return <IDsCard />;
      case "FedsCard":
        return <FedsCard />;
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: session, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError) {
          throw new Error(`Session Error: ${sessionError.message}`);
        }

        if (!session) {
          throw new Error("No active session found");
        }

        let { data: fetchedData, error } = await supabase
          .from("Drops")
          .select("*");

        if (error) {
          throw new Error(`Data Fetch Error: ${error.message}`);
        }

        if (fetchedData) {
          setData(fetchedData);
        } else {
          console.error("No data available");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchData();
  }, []);

  const getOptionsForSelect = (index: number) => {
    if (!data.length) return [];

    let filteredData = data;
    const keys: (keyof DropdownItem)[] = [
      "product",
      "type",
      "availability",
      "validity",
      "residency",
      "address",
      "document",
      "blank",
      "requirements",
    ];
    for (let i = 0; i < index; i++) {
      if (selections[i] !== null) {
        filteredData = filteredData.filter(
          (item) => item[keys[i]] === selections[i]
        );
      }
    }
    return Array.from(
      new Set(filteredData.map((item) => item[keys[index]]))
    ).filter(Boolean);
  };

  const handleSelectionChange = (selectIndex: number, value: string) => {
    let updatedSelections = [...selections];
    updatedSelections[selectIndex] = value === "none" ? null : value; // Handle 'none' as null

    if (
      selectIndex === 6 &&
      updatedSelections.slice(0, 7).every((selection) => selection !== null)
    ) {
      updatedSelections[7] = ""; // Automatically set the 8th dropdown as blank, indicating ready to show 'requirements'
    }

    for (let i = selectIndex + 1; i < updatedSelections.length; i++) {
      updatedSelections[i] = null; // Reset selections for dropdowns that follow
    }
    setSelections(updatedSelections);
  };

  const resetSelections = () => {
    setSelections(Array(7).fill(null));
  };

  const canShowColumnH = () => {
    const areSevenDropdownsSelected = selections
      .slice(0, 7)
      .every((selection) => selection !== null);
    const isBlankAutomaticallySet = selections[7] === ""; // Check if the blank column is set as intended

    if (areSevenDropdownsSelected && isBlankAutomaticallySet) {
      return true;
    }

    return selections.some((selection, index) => {
      return selection !== null && getOptionsForSelect(index + 1).length === 0;
    });
  };

  const columnHText = canShowColumnH()
    ? data.find((row) => {
        const keys: (keyof DropdownItem)[] = [
          "product",
          "type",
          "availability",
          "validity",
          "residency",
          "address",
          "document",
          "requirements",
        ];
        return selections.every(
          (selection, index) =>
            selection === null || row[keys[index]] === selection
        );
      })?.requirements
    : "";

  return (
    <RoleBasedWrapper
      allowedRoles={["user", "auditor", "admin", "super admin", "dev"]}
    >
      <div>
        <div className="flex flow-row items-center justify-center max w-full mb-40 mt-20">
          <SupportMenu />
          {activeDialogContentId}
        </div>
        <div className="flex flex-col justify-center px-4 space-y-6 mx-auto max-w-sm">
          {selections.map((selection, index) => (
            <Select
              key={index}
              disabled={index > 0 && selections[index - 1] === null}
              onValueChange={(value) => handleSelectionChange(index, value)}
              value={selection || "none"}
            >
              <SelectTrigger className="flex max-w-full">
                <SelectValue
                  placeholder={`Select from ${String.fromCharCode(
                    "A".charCodeAt(0) + index
                  )}`}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">...</SelectItem>
                {getOptionsForSelect(index).map((option, optionIndex) => (
                  <SelectItem key={optionIndex} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
        <br />
        <div className="flex flex-row justify-center mx-auto max-w-[700px]">
          {columnHText &&
            (columnHText as string).split("\n").map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
        </div>
        <div className="flex flex-row justify-center mt-10 md:mt-10 lg:mt-12">
          <Button
            variant="gooeyLeft"
            onClick={resetSelections}
            className="mb-6 flex-shrink py-1"
          >
            Reset Selections
          </Button>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}
