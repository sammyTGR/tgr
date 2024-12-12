"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IDsCard from "../cards/IDsCard";
import dynamic from "next/dynamic";
import { supabase } from "../../../../utils/supabase/client";
import FedsCard from "../cards/FedsCard";
import RoleBasedWrapper from "@/components/RoleBasedWrapper";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BannedFirearmsPage from "../banned/page";
import { useState } from "react";

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
  const queryClient = useQueryClient();
  const [activeDialogContentId, setActiveDialogContentId] = useState<
    string | null
  >(null);

  const { data: dropsData = [], isLoading } = useQuery({
    queryKey: ["drops-data"],
    queryFn: async () => {
      const { data: fetchedData, error } = await supabase
        .from("Drops")
        .select("*");
      if (error) throw error;
      return fetchedData as DropdownItem[];
    },
  });

  const { data: selections = Array(8).fill(null) } = useQuery({
    queryKey: ["selections"],
    initialData: Array(8).fill(null),
  });

  const selectionsMutation = useMutation({
    mutationFn: (newSelections: (string | null)[]) => {
      return Promise.resolve(newSelections);
    },
    onSuccess: (newSelections) => {
      queryClient.setQueryData(["selections"], newSelections);
    },
  });

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

  const getOptionsForSelect = (index: number) => {
    if (!dropsData?.length) return [];

    let filteredData = dropsData;
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
    const updatedSelections = [...selections];
    updatedSelections[selectIndex] = value === "none" ? null : value;

    if (
      selectIndex === 6 &&
      updatedSelections.slice(0, 7).every((selection) => selection !== null)
    ) {
      updatedSelections[7] = "";
    }

    for (let i = selectIndex + 1; i < updatedSelections.length; i++) {
      updatedSelections[i] = null;
    }

    selectionsMutation.mutate(updatedSelections);
  };

  const resetSelections = () => {
    selectionsMutation.mutate(Array(7).fill(null));
  };

  const canShowColumnH = () => {
    const areSevenDropdownsSelected = selections
      .slice(0, 7)
      .every((selection) => selection !== null);
    const isBlankAutomaticallySet = selections[7] === "";

    if (areSevenDropdownsSelected && isBlankAutomaticallySet) {
      return true;
    }

    return selections.some((selection, index) => {
      return selection !== null && getOptionsForSelect(index + 1).length === 0;
    });
  };

  const columnHText = canShowColumnH()
    ? dropsData.find((row) => {
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
      <main className="grid flex-1 items-start my-4 mb-4 max-w-7xl mx-auto gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex flow-row items-center justify-center max w-full mb-10">
          <SupportMenu />
        </div>

        <Tabs defaultValue="dros-guide">
          <div className="flex items-center space-x-2">
            <TabsList>
              <TabsTrigger value="dros-guide">DROS Guide</TabsTrigger>
              <TabsTrigger value="assault-weapons">
                Assault Weapons Table
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dros-guide">
            <div className="flex flex-col justify-center space-y-6 py-10 mx-auto max-w-sm">
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
            <div className="flex flex-row justify-center mt-10">
              <Button
                variant="gooeyLeft"
                onClick={resetSelections}
                className="mb-6 flex-shrink py-1"
              >
                Reset Selections
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="assault-weapons">
            <BannedFirearmsPage />
          </TabsContent>
        </Tabs>
      </main>
    </RoleBasedWrapper>
  );
}
