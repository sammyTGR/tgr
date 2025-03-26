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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar";

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
  const { state } = useSidebar();
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
    updatedSelections[selectIndex] = value;

    for (let i = selectIndex + 1; i < updatedSelections.length; i++) {
      updatedSelections[i] = null;
    }

    const currentOptions = getOptionsForSelect(selectIndex + 1);
    if (currentOptions.length === 0) {
      selectionsMutation.mutate(updatedSelections);
    } else {
      selectionsMutation.mutate(updatedSelections);
    }
  };

  const resetSelections = () => {
    selectionsMutation.mutate(Array(8).fill(null));
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
      <div
        className={`items-center space-y-4 p-4 ${state === "collapsed" ? "w-[calc(100vw-30rem)] mt-12 ml-24 mx-auto" : "w-[calc(100vw-30rem)] mt-12 ml-24 mx-auto"} transition-all duration-300`}
      >
        <div className="flex flow-row items-center justify-between mb-8">
          <div className="flex justify-center items-center mx-auto mb-24 w-full">
            <SupportMenu />
          </div>
        </div>

        <Tabs defaultValue="dros-guide" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dros-guide">DROS Guide</TabsTrigger>
            <TabsTrigger value="assault-weapons">
              Banned Assault Weapons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dros-guide">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Selection Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {selections.map((selection, index) => {
                      const shouldShow =
                        index === 0 ||
                        (selections[index - 1] !== null &&
                          getOptionsForSelect(index).length > 0 &&
                          getOptionsForSelect(index - 1).length > 0);

                      if (!shouldShow) return null;

                      return (
                        <Select
                          key={index}
                          disabled={index > 0 && selections[index - 1] === null}
                          onValueChange={(value) =>
                            handleSelectionChange(index, value)
                          }
                          value={selection || undefined}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={selection === null ? `` : selection}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {getOptionsForSelect(index).map(
                              (option, optionIndex) => (
                                <SelectItem key={optionIndex} value={option}>
                                  {option}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {columnHText && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {(columnHText as string)
                        .split("\n")
                        .map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button
                  variant="gooeyLeft"
                  onClick={resetSelections}
                  className="w-full sm:w-auto"
                >
                  Reset Selections
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assault-weapons">
            <BannedFirearmsPage />
          </TabsContent>
        </Tabs>
      </div>
    </RoleBasedWrapper>
  );
}
