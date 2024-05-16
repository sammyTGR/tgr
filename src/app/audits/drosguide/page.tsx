"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IDsCard from '../Cards/IDsCard';
import dynamic from 'next/dynamic';
import {createClerkSupabaseClient} from '../../../../supabase/lib/supabaseClient';
import FedsCard from '../Cards/FedsCard';

// Example type definition, adjust based on your actual data structure
type DataRow = string[]; // Represents a single row of data as an array of strings
type Data = DataRow[]; // Represents the entire dataset as an array of DataRow
const SupportMenu = dynamic(() => import('@/components/ui/SupportMenu'), { ssr: false });

const supabase = createClerkSupabaseClient();

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

const DROSGuide = () => {
  const [data, setData] = useState<DropdownItem[]>([]);
  const [selections, setSelections] = useState<(string | null)[]>(Array(8).fill(null));
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [activeDialog, setActiveDialog] = useState(null);
  const [activeDialogContentId, setActiveDialogContentId] = useState<string | null>(null);

  // Function to handle clicks on sub-item labels in MappedDynamicMenu
  const handleSubItemClick = (contentId: string) => {
    setActiveDialogContentId(contentId);
  };

  // Render the appropriate content based on activeDialogContentId
  const renderDialogContent = () => {
    switch(activeDialogContentId) {
      case 'IDsCard':
        return <IDsCard />;
      case 'FedsCard':
        return <FedsCard />;
      // Handle other cases...
      default:
        return null;
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
        let { data: fetchedData, error } = await supabase
            .from('Drops')
            .select('*');

        if (error) {
            console.error('Failed to fetch data:', error.message);
            return;
        }

        if (fetchedData) {
            // console.log("Fetched raw data:", fetchedData);
            setData(fetchedData);
        } else {
            console.error('No data available');
        }
    };

    fetchData();
}, []);

const getOptionsForSelect = (index: number) => {
  if (!data.length) return [];

  let filteredData = data;
  const keys: (keyof DropdownItem)[] = ['product', 'type', 'availability', 'validity', 'residency', 'address', 'document', 'blank', 'requirements'];
  for (let i = 0; i < index; i++) {
      if (selections[i] !== null) {
          filteredData = filteredData.filter(item => item[keys[i]] === selections[i]);
      }
  }
  return Array.from(new Set(filteredData.map(item => item[keys[index]]))).filter(Boolean);
};


const handleSelectionChange = (selectIndex: number, value: string) => {
  let updatedSelections = [...selections];
  updatedSelections[selectIndex] = value === 'none' ? null : value; // Handle 'none' as null

  // Automatically set the 8th dropdown if the first 7 are selected
  if (selectIndex === 6 && updatedSelections.slice(0, 7).every(selection => selection !== null)) {
      updatedSelections[7] = ""; // Automatically set the 8th dropdown as blank, indicating ready to show 'requirements'
  }

  for (let i = selectIndex + 1; i < updatedSelections.length; i++) {
      updatedSelections[i] = null; // Reset selections for dropdowns that follow
  }
  setSelections(updatedSelections);
};


  // Function to reset the selections
  const resetSelections = () => {
    setSelections(Array(7).fill(null)); // Reset to initial state
  };

  const canShowColumnH = () => {
    const areSevenDropdownsSelected = selections.slice(0, 7).every(selection => selection !== null);
    const isBlankAutomaticallySet = selections[7] === ""; // Check if the blank column is set as intended

    if (areSevenDropdownsSelected && isBlankAutomaticallySet) {
        return true;
    }

    return selections.some((selection, index) => {
        return selection !== null && getOptionsForSelect(index + 1).length === 0;
    });
};




const columnHText = canShowColumnH() ? data.find(row => {
  const keys: (keyof DropdownItem)[] = ['product', 'type', 'availability', 'validity', 'residency', 'address', 'document', 'requirements'];
  return selections.every((selection, index) => selection === null || row[keys[index]] === selection);
})?.requirements : '';



  return (
    <div >
     <div className="flex flow-row items-center justify-center max w-full mb-48">
         <SupportMenu />
         {/* Render dialog content */}
      {activeDialogContentId}
         </div>
    <div className="flex flex-col justify-center px-4 space-y-6 mx-auto max-w-lg">
      {selections.map((selection, index) => (
        <Select key={index}
                disabled={index > 0 && selections[index - 1] === null}
                onValueChange={(value) => handleSelectionChange(index, value)}
                value={selection || 'none'}>
          <SelectTrigger className="flex max-w-full">
            <SelectValue placeholder={`Select from ${String.fromCharCode('A'.charCodeAt(0) + index)}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">...</SelectItem>
            {getOptionsForSelect(index).map((option, optionIndex) => (
              <SelectItem key={optionIndex} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      </div>
      <br/>
      <div className="flex flex-row justify-center mx-auto max-w-[700px]">
      {columnHText && (columnHText as string).split('\n').map((line, index) => (
        <React.Fragment key={index}>
          {line}
          <br />
        </React.Fragment>
      ))}
      </div>
      <div className="flex flex-row justify-center mt-10 md:mt-10 lg:mt-12">
      <Button onClick={resetSelections} className="mb-6 flex-shrink mt-10 py-2">
          Reset Selections
        </Button>
      </div>
    </div>

  );
};
export default DROSGuide;
