// src/app/TGR/dros/guide/page
'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IDsCard from '../cards/IDsCard';
import dynamic from 'next/dynamic';
import { supabase } from '../../../../utils/supabase/client';
import FedsCard from '../cards/FedsCard';
import RoleBasedWrapper from '@/components/RoleBasedWrapper';
import { useQuery } from '@tanstack/react-query';
import BannedFirearmsPage from '../banned/page';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSidebar } from '@/components/ui/sidebar';
import ApprovedDevices from './_components/ApprovedDevices';
import OemFsd from './_components/OemFsd';

type DataRow = string[];
type Data = DataRow[];
const SupportMenu = dynamic(() => import('@/components/ui/SupportNavMenu'), {
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
  const [activeDialogContentId, setActiveDialogContentId] = useState<string | null>(null);

  const [selections, setSelections] = useState<(string | null)[]>(Array(8).fill(null));

  const { data: dropsData = [], isLoading } = useQuery({
    queryKey: ['drops-data'],
    queryFn: async () => {
      const { data: fetchedData, error } = await supabase.from('Drops').select('*');
      if (error) throw error;
      return fetchedData as DropdownItem[];
    },
  });

  const handleSubItemClick = (contentId: string) => {
    setActiveDialogContentId(contentId);
  };

  const renderDialogContent = () => {
    switch (activeDialogContentId) {
      case 'IDsCard':
        return <IDsCard />;
      case 'FedsCard':
        return <FedsCard />;
      default:
        return null;
    }
  };

  const getOptionsForSelect = (index: number) => {
    if (!dropsData?.length) return [];

    let filteredData = dropsData;
    const keys: (keyof DropdownItem)[] = [
      'product',
      'type',
      'availability',
      'validity',
      'residency',
      'address',
      'document',
      'blank',
      'requirements',
    ];

    for (let i = 0; i < index; i++) {
      if (selections[i] !== null) {
        filteredData = filteredData.filter((item) => item[keys[i]] === selections[i]);
      }
    }
    return Array.from(new Set(filteredData.map((item) => item[keys[index]]))).filter(Boolean);
  };

  const handleSelectionChange = (selectIndex: number, value: string) => {
    const updatedSelections = [...selections];
    updatedSelections[selectIndex] = value;
    for (let i = selectIndex + 1; i < updatedSelections.length; i++) {
      updatedSelections[i] = null;
    }
    setSelections(updatedSelections);
  };

  const resetSelections = () => {
    setSelections(Array(8).fill(null));
  };

  const canShowColumnH = () => {
    const areSevenDropdownsSelected = selections
      .slice(0, 7)
      .every((selection) => selection !== null);
    const isBlankAutomaticallySet = selections[7] === '';

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
          'product',
          'type',
          'availability',
          'validity',
          'residency',
          'address',
          'document',
          'requirements',
        ];
        return selections.every(
          (selection, index) => selection === null || row[keys[index]] === selection
        );
      })?.requirements
    : '';

  return (
    <RoleBasedWrapper allowedRoles={['user', 'auditor', 'admin', 'super admin', 'dev']}>
      <div className="flex flex-col w-full space-y-6">
        <div className="mx-auto sticky top-0 z-40 bg-background">
          <SupportMenu />
        </div>

        <div className="container mx-auto px-4 pb-8">
          <Tabs defaultValue="dros-guide" className="space-y-6">
            <TabsList className="border border-zinc-800 shadow-sm rounded-md m-1 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 focus:z-10">
              <TabsTrigger
                value="dros-guide"
                className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                DROS Guide
              </TabsTrigger>
              <TabsTrigger
                value="assault-weapons"
                className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Banned Assault Weapons
              </TabsTrigger>
              <TabsTrigger
                value="approved-devices"
                className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                Approved Devices
              </TabsTrigger>
              <TabsTrigger
                value="fsd-info"
                className="flex-1 relative py-2 text-sm font-medium whitespace-nowrap data-[state=active]:ring-2 data-[state=active]:ring-blue-600 data-[state=active]:ring-opacity-50"
              >
                OEM FSD Info
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
                            onValueChange={(value) => handleSelectionChange(index, value)}
                            value={selection || undefined}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={selection === null ? `` : selection} />
                            </SelectTrigger>
                            <SelectContent>
                              {getOptionsForSelect(index).map((option, optionIndex) => (
                                <SelectItem key={optionIndex} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
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
                        {(columnHText as string).split('\n').map((line, index) => (
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

            <TabsContent value="approved-devices">
              <ApprovedDevices />
            </TabsContent>

            <TabsContent value="fsd-info">
              <OemFsd />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RoleBasedWrapper>
  );
}
